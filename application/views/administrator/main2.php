<?php if ( ! defined('APPPATH')) exit('No direct script access allowed'); ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
		<title>Administrator</title>
		
		<!-- Include the ExtJS CSS Theme-->
		<link rel="stylesheet" type="text/css" href="frontend/administrator/css/admin-theme.css"/>
		<link rel="stylesheet" type="text/css" href="frontend/administrator/js/Ext.ux/statusbar/css/statusbar.css"/>
		
		<!--<link rel="stylesheet" type="text/css" href="frontend/administrator/css/sink.css"/>-->
		<link rel="icon" href="favicon.ico"/>
		
		<script type="text/javascript">
			window.parameters = {
				"basePath":"<?php echo base_url('administrator'); ?>",
				"baseResource":"<?php echo base_url('frontend/administrator/'); ?>",
			};
		</script>
		
		<!-- Include the ExtJS JavaScript Library -->
		<script type="text/javascript" src="frontend/administrator/extjs/bootstrap.js"></script> 
		<!--<script type="text/javascript" src="frontend/administrator/extjs/ext-all.js"></script>-->
		<!--<script type="text/javascript" src="frontend/administrator/extjs/ext-neptune.js"></script>-->
		<script type="text/javascript" src="frontend/administrator/js/Ext.ux/Ext.ux.formatter-all.js"></script>
		<script type="text/javascript" src="frontend/administrator/js/org.phpjs.lib/php.default.min.js"></script>
		<script type="text/javascript" src="frontend/administrator/js/App/administrator.js"></script>
	</head>
	<body>
		<div id="loading"><span class="logo"></span></div>
	</body>
</html>