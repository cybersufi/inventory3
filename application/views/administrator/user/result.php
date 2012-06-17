<?php

	header("Content-Type: text/html; charset=UTF-8");
	header("Cache-Control: no-cache, must-revalidate");
	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Headers: lang,call,service,X-Requested-With,X-PartKeepr-Locale,X-PartKeepr-Name,X-PartKeepr-Call");
	
	if ($status != "ok") {
		header('HTTP/1.0 400 Exception', false, 400);
	}
	
	$response = array();
	$response["status"] = $status;
	$response["success"] = $success;
	if ($status != 'ok') {
		$response["exception"] = $result;
	} else {
		$response["response"] = $result;
	}
	$response["timing"] = microtime(true) - $timingStart;
	
	echo json_encode($response);

?>