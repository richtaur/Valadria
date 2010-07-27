#!/usr/bin/env python

import cgi
import logging
import os

from django.utils import simplejson
from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp.util import login_required

MIN_LENGTH = 2
MAX_LENGTH = 20
# TODO: make a regex for a valid name instead and include it in the output to JSON
#VALID_NAME = r"tbd"

class Player(db.Model):
  name = db.StringProperty(multiline = False)
  auth_token = db.StringProperty(multiline = False)
  date_created = db.DateTimeProperty(auto_now_add = True)
  date_last_activity = db.DateTimeProperty(auto_now = True)
  user_id = db.StringProperty(multiline = False)

class Character(db.Model):
  # Basic info.
  player_id = db.IntegerProperty()
  name = db.StringProperty(multiline = False)
  class_type = db.StringProperty(multiline = False)
  date_created = db.DateTimeProperty(auto_now_add = True)
  date_last_activity = db.DateTimeProperty(auto_now = True)

  # Map data.
  map_name = db.StringProperty(multiline = False)
  map_x = db.IntegerProperty()
  map_y = db.IntegerProperty()

  # Game stats.
  level = db.IntegerProperty()
  xp = db.IntegerProperty()
  hp = db.IntegerProperty()
  hp_max = db.IntegerProperty()
  mp = db.IntegerProperty()
  mp_max = db.IntegerProperty()
  attack = db.IntegerProperty()
  defense = db.IntegerProperty()
  magic_power = db.IntegerProperty()

characterData = {
  'mage' : {
    'name' : 'Mage',
    'sprite' : [2, 0],
    'level_modifier' : 0.5,
    'hp' : 20,
    'mp' : 20,
    'attack' : 1,
    'defense' : 0,
    'magic_power' : 10
  },
  'priest' : {
    'name' : 'Priest',
    'sprite' : [6, 1],
    'level_modifier' : 0.5,
    'hp' : 35,
    'mp' : 10,
    'attack' : 4,
    'defense' : 1,
    'magic_power' : 5
  },
  'rogue' : {
    'name' : 'Rogue',
    'sprite' : [3, 0],
    'level_modifier' : 0.7,
    'hp' : 30,
    'mp' : 0,
    'attack' : 10,
    'defense' : 1,
    'magic_power' : 0
  },
  'warlock' : {
    'name' : 'Warlock',
    'sprite' : [4, 0],
    'level_modifier' : 0.6,
    'hp' : 15,
    'mp' : 20,
    'attack' : 2,
    'defense' : 0,
    'magic_power' : 12
  },
  'warrior' : {
    'name' : 'Warrior',
    'sprite' : [7, 0],
    'level_modifier' : 0.5,
    'hp' : 50,
    'mp' : 0,
    'attack' : 8,
    'defense' : 3,
    'magic_power' : 0
  }
}

# method = create_character
# name = (string)
# class_type = (string)
def create_character(player_id, class_type, name):

  if not class_type in characterData:
    return {
      'error' : True,
      'message' : 'Invalid class_type.'
    }

  if not valid_name(name):
    return {
      'error' : True,
      'message' : 'Invalid name. Must be %s-%s characters.' % (MIN_LENGTH, MAX_LENGTH)
    }

  level = 1
  hp = get_stat(class_type, level, 'hp')
  mp = get_stat(class_type, level, 'mp')

  character = Character()
  character.player_id = player_id
  character.name = name
  character.class_type = class_type
  character.map_name = 'valadria'
  character.map_x = 5
  character.map_y = 5
  character.level = level
  character.xp = 0
  character.hp = hp
  character.hp_max = hp
  character.mp = mp
  character.mp_max = mp
  character.attack = get_stat(class_type, level, 'attack')
  character.defense = get_stat(class_type, level, 'defense')
  character.magic_power = get_stat(class_type, level, 'magic_power')
  character.put()

  return {
    'character' : format_json(character),
    'message' : 'Created character_id: %s' % character.key().id()
  }

def dump(obj):
  for attr in dir(obj):
    logging.error('obj.%s = %s' % (attr, getattr(obj, attr)))

def format_json(obj):
  data = {}

  for attr in obj.properties():
    value = getattr(obj, attr)
    if not type(value).__name__ == 'datetime':
      data[attr] = value

  return data

def get_map_by_name(name):
  try:
    f = open('game_data/maps/%s.json' % name);
    data = simplejson.loads(f.read())
    return data
  except:
    return False

def get_stat(class_type, level, stat):
  value = characterData[class_type][stat]
  per_level = int(value * characterData[class_type]['level_modifier'])
  return (value + (per_level * (level - 1)))

# TODO
def valid_name(name):
  l = len(name)
  return (
    (l >= MIN_LENGTH)
    and (l <= MAX_LENGTH)
  )

def get_characters_by_player_id(player_id, format = 'json'):
  characters = db.GqlQuery('SELECT * FROM Character WHERE player_id = :1', player_id)

  if format == 'json':
    data = []
    for character in characters:
      data.append(format_json(character))
    return data

  return characters

def get_current_player(user):
  player = None
  players = db.GqlQuery('SELECT * FROM Player WHERE user_id = :1 LIMIT 1', user.user_id())

  for player in players:
    pass

  if not player:
    player = Player(name = user.nickname(), user_id = user.user_id())
    player.put()

  return player

class MainHandler(webapp.RequestHandler):

  @login_required
  def get(self):
    user = users.get_current_user()
    player = get_current_player(user)
    characters = get_characters_by_player_id(player.key().id())

    game_data = {
      'characterData' : characterData,
      'characters' : characters,
      'player' : {
        'id' : player.key().id(),
        'name' : player.name,
        'auth_token' : player.auth_token,
        'user_id' : player.user_id
      }
    }

    template_values = {
      'game_data' : simplejson.dumps(game_data),
      'nickname' : user.nickname(),
      'url_login' : users.create_login_url(self.request.uri),
      'url_logout' : users.create_logout_url(self.request.uri)
    }
    
    path = os.path.join(os.path.dirname(__file__), 'main.tpl')
    self.response.out.write(template.render(path, template_values))

class APIHandler(webapp.RequestHandler):

  def get(self):
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps({
      'message' : 'Valadria API.'
    }))

  def post(self):
    self.response.headers['Content-Type'] = 'application/json'

    user = users.get_current_user()

    if (not user):
      self.response.out.write(simplejson.dumps({
        'error' : True,
        'message' : 'Must be logged in to interact with the Valadria API.'
      }))
      return

    player = get_current_player(user)

    try:
      player_id = int(self.request.get('player_id'))
    except:
      player_id = 0

    if int(player_id) != int(player.key().id()):
      self.response.out.write(simplejson.dumps({
        'error' : True,
        'message' : 'Mismatched player_id.'
      }))
      return

    method = self.request.get('method')

    if method == 'create_character':
      self.response.out.write(simplejson.dumps(
        create_character(
          player_id = player_id,
          class_type = self.request.get('class_type'),
          name = self.request.get('name')
        )
      ))
      return

    if method == 'get_map':
      name = self.request.get('name')
      map = get_map_by_name(name)
      if map:
        self.response.out.write(simplejson.dumps(map))
      else:
        self.response.out.write(simplejson.dumps({
          'error' : True,
          'message' : 'Unknown map: %s.' % name
        }))
      return

    self.response.out.write(simplejson.dumps({
      'error' : True,
      'message' : 'Unknown method: %s.' % method
    }))

def main():
  application = webapp.WSGIApplication(
    [
      ('/', MainHandler),
      ('/api', APIHandler)
    ],
    debug = True
  )
  util.run_wsgi_app(application)

if __name__ == '__main__':
  main()
