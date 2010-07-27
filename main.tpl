<!DOCTYPE html>
<html>
<head>
	<link href="favicon.ico" rel="shortcut icon" type="/image/vnd.microsoft.icon">
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<style>
		body {
			background: #FFF;
			margin: 0;
			padding: 0;
		}
		#debug {
			font-size: 12px;
			position: absolute;
			left: 640px;
		}
	</style>
	<title>Valadria</title>
</head>
<body>

<div id="valadria"></div>
<div id="debug"></div>

<!-- DGE core -->
<script src="js/diggy/core/dge.js"></script>
<script src="js/diggy/core/patches.js"></script>
<script src="js/diggy/core/object.js"></script>
<script src="js/diggy/core/audio.js"></script>
<script src="js/diggy/core/data.js"></script>
<script src="js/diggy/core/interval.js"></script>
<script src="js/diggy/core/keyboard.js"></script>
<script src="js/diggy/core/json.js"></script>
<script src="js/diggy/core/loader.js"></script>
<script src="js/diggy/core/mouse.js"></script>
<script src="js/diggy/core/sprite.js"></script>
<script src="js/diggy/core/text.js"></script>
<script src="js/diggy/core/xhr.js"></script>

<!-- DGE plugins -->
<script src="js/diggy/plugins/sprite.animate.js"></script>
<script src="js/diggy/plugins/sprite.sheet.js"></script>
<!--script src="js/diggy/plugins/sprite.tile.js"></script-->
<script src="js/diggy/plugins/text.input.js"></script>
<!--script src="js/diggy/plugins/meter.js"></script-->
<script src="js/diggy/plugins/bbcode.js"></script>
<!--script src="js/diggy/plugins/list.js"></script-->

<!-- This game's scripts -->
<script src="js/valadria.js"></script>
<script>valadria({{ game_data }});</script>

</body>
</html>
