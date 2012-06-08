<?php

	header("Content-Type: text/html; charset=UTF-8");
	header("Cache-Control: no-cache, must-revalidate");
	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Headers: lang,call,service,X-Requested-With,X-PartKeepr-Locale,X-PartKeepr-Name,X-PartKeepr-Call");
	header('HTTP/1.0 400 Exception', false, 400);
	$response = array();
	$timingStart = microtime(true);
	$response["status"] = "error";
	$response["success"] = false;
	$response["exception"] = array(
		"message" => strip_tags($message),
		"exception" => 'null',
		"backtrace" => 'null');
	$response["timing"] = microtime(true) - $timingStart;
	
	echo json_encode($response);

?>