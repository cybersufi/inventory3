<?php if ( ! defined('APPPATH')) exit('No direct script access allowed'); ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
		<title>Administrator</title>
		
		<!-- Include the ExtJS CSS Theme -->
		<link rel="stylesheet" type="text/css" href="frontend/administrator/css/admin-theme.css"/>
		<link rel="stylesheet" type="text/css" href="frontend/administrator/js/Ext.ux/statusbar/css/statusbar.css"/>
		<link rel="stylesheet" type="text/css" href="frontend/administrator/css/Administrator.css"/>
		<link rel="icon" href="favicon.ico"/>
		
		<script type="text/javascript">
			window.parameters = {
				"basePath":"<?php echo base_url('administrator'); ?>",
				"baseResource":"<?php echo base_url('frontend/administrator/'); ?>",
				"doctrine_orm_version":"2.2.2",
				"doctrine_dbal_version":"2.2.2",
				"doctrine_common_version":"2.2.2",
				"php_version":"5.3.8",
				"maxUploadSize":8388608,
				"availableImageFormats":["3FR","A","AAI","AI","ART","ARW","AVI","AVS",
										 "B","BGR","BGRA","BIE","BMP","BMP2","BMP3","BRF","C",
										 "CAL","CALS","CANVAS","CAPTION","CIN","CIP","CLIP","CLIPBOARD",
										 "CMYK","CMYKA","CR2","CRW","CUR","CUT","DCM","DCR","DCX","DDS","DFONT",
										 "DJVU","DNG","DOT","DPS","DPX","EMF","EPDF","EPI","EPS","EPS2","EPS3",
										 "EPSF","EPSI","EPT","EPT2","EPT3","ERF","EXR","FAX","FITS","FPX","FRACTAL",
										 "FTS","G","G3","GIF","GIF87","GRADIENT","GRAY","GROUP4","HALD","HDR","HISTOGRAM",
										 "HRZ","HTM","HTML","ICB","ICO","ICON","INFO","INLINE","IPL","ISOBRL","J2C","JBG",
										 "JBIG","JNG","JP2","JPC","JPEG","JPG","JPX","K","K25","KDC","LABEL","M","M2V","M4V",
										 "MAC","MAP","MAT","MATTE","MEF","MIFF","MNG","MONO","MOV","MP4","MPC","MPEG","MPG",
										 "MRW","MSL","MSVG","MTV","MVG","NEF","NRW","NULL","O","ORF","OTB","OTF","PAL","PALM",
										 "PAM","PANGO","PATTERN","PBM","PCD","PCDS","PCL","PCT","PCX","PDB","PDF","PDFA",
										 "PEF","PES","PFA","PFB","PFM","PGM","PGX","PICON","PICT","PIX","PJPEG","PLASMA","PNG",
										 "PNG24","PNG32","PNG8","PNM","PPM","PREVIEW","PS","PS2","PS3","PSB","PSD","PTIF","PWP",
										 "R","RADIAL-GRADIENT","RAF","RAS","RGB","RGBA","RGBO","RLA","RLE","SCR","SCT","SFW",
										 "SGI","SHTML","SR2","SRF","STEGANO","SUN","SVG","SVGZ","TEXT","TGA","THUMBNAIL","TIFF",
										 "TIFF64","TILE","TIM","TTC","TTF","TXT","UBRL","UIL","UYVY","VDA","VICAR","VID","VIFF",
										 "VST","WBMP","WEBP","WMF","WMFWIN32","WMV","WMZ","WPG","X","X3F","XBM","XC","XCF","XPM",
										 "XPS","XV","XWD","Y","YCbCr","YCbCrA","YUV"
				]
			};
		</script>
		
		<!-- Include the ExtJS JavaScript Library -->
		<script type="text/javascript" src="frontend/administrator/extjs/bootstrap.js"></script> 
		<script type="text/javascript" src="frontend/administrator/extjs/ext-all.js"></script>
		<script type="text/javascript" src="frontend/administrator/js/App/administrator.js"></script>
		<script type="text/javascript" src="frontend/administrator/js/Ext.ux/Ext.ux.formatter-all.js"></script>
				
		<script type="text/javascript" src="frontend/administrator/js/org.phpjs.lib/php.default.min.js"></script>
	</head>
	<body>
		<div id="loading"><span class="logo"></span></div>
	</body>
</html>