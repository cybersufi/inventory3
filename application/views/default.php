<?php if ( ! defined('APPPATH')) exit('No direct script access allowed'); ?>

<!DOCTYPE html> <html lang="en">
<head>
	<meta charset="utf-8">
	<title><?php echo $page_title; ?></title>

	<style type="text/css">

	::selection{ background-color: #E13300; color: white; }
	::moz-selection{ background-color: #E13300; color: white; }
	::webkit-selection{ background-color: #E13300; color: white; }

	body {
		background-color: #fff;
		margin: 40px;
		font: 13px/20px normal Helvetica, Arial, sans-serif;
		color: #4F5155;
	}

	a {
		color: #003399;
		background-color: transparent;
		font-weight: normal;
	}

	h1 {
		color: #444;
		background-color: transparent;
		border-bottom: 1px solid #D0D0D0;
		font-size: 19px;
		font-weight: normal;
		margin: 0 0 14px 0;
		padding: 14px 15px 10px 15px;
	}
	
	h2 {
		color: #444;
		background-color: transparent;
		border-bottom: 1px solid #D0D0D0;
		font-size: 17px;
		font-weight: normal;
		margin: 0 0 14px 0;
		padding: 14px 15px 10px 15px;
	}
	
	h3 {
		color: #444;
		background-color: transparent;
		border-bottom: 1px solid #D0D0D0;
		font-size: 15px;
		font-weight: normal;
		margin: 0 0 14px 0;
		padding: 14px 15px 10px 15px;
	}
	
	h4 {
		color: #444;
		background-color: transparent;
		border-bottom: 1px solid #D0D0D0;
		font-size: 12px;
		font-weight: normal;
		margin: 0 0 14px 0;
		padding: 14px 15px 10px 15px;
	}

	code {
		font-family: Consolas, Monaco, Courier New, Courier, monospace;
		font-size: 12px;
		background-color: #f9f9f9;
		border: 1px solid #D0D0D0;
		color: #002166;
		display: block;
		margin: 14px 0 14px 0;
		padding: 12px 10px 12px 10px;
	}

	#body{
		margin: 0 15px 0 15px;
	}
	
	p.footer{
		text-align: right;
		font-size: 11px;
		border-top: 1px solid #D0D0D0;
		line-height: 32px;
		padding: 0 10px 0 10px;
		margin: 20px 0 0 0;
	}
	
	#container{
		margin: 10px;
		border: 1px solid #D0D0D0;
		-webkit-box-shadow: 0 0 8px #D0D0D0;
	}
	
	#list5 { color:#eee; }
	#list5 ol { font-size:18px; }
	#list5 ol li { }
	#list5 ol li ol { list-style-image: url("../images/nested.png"); padding:5px 0 5px 18px; font-size:15px; }
	#list5 ol li ol li { color:#bfe1f1; height:15px; margin-left:10px; }
	</style>
</head>
<body>

<div id="container">
	<h1><?php echo $page_title; ?></h1>
	<div id="body">
		<p><h2><b>Functions List :</b></h2></p>
		<div class="list5">
		<ul>
		<?php 
			foreach ($function_list as $function) {
				//echo '<code>
				echo '<li><p><h3><b>'.$function['function_name'].'</b</h3></p>
				<p>'.$function['function_desc'].'</p>';
				
				if (count($function['function_param']) > 0) {
					echo '<p><b>Parameters</b></p><ul>';
					foreach ($function['function_param'] as $params) {
						echo '<li><b>'.$params['name'].'</b>';
						echo '<p>'.$params['desc'].'</p>';
						echo '</li>';
					}
					echo '</ul>';
				}
				
				if ($function['function_return']) {
					echo '<p><b>Return</b></p>';
					echo '<li><b>'.$function['function_return']['object'].'</b></li>';
					echo '<p>'.$function['function_return']['desc'].'</p>';
				}
				echo '</li>';
			}
		?>
		</ul>
		</div>
	</div>

	<p class="footer">Page rendered in <strong>{elapsed_time}</strong> seconds</p>
</div>

</body>
</html>