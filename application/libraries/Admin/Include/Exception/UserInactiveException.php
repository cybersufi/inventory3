<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

/**
 * Is thrown when the user has given wrong credentials.
 */
class UserInactiveException extends SerializableException {
	public function __construct () {
		parent::__construct("Access Denied. Your account is not activated. Please contact the administrator");
	}
}