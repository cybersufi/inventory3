<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

/**
 * Is thrown when the user has given wrong credentials.
 */
class UserBannedException extends SerializableException {
	public function __construct ($message) {
		parent::__construct("Access Denied. Your Account has been banned for the following reason : ".$message);
	}
}