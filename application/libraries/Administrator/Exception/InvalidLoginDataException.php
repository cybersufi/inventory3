<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

/**
 * Is thrown when the user has given wrong credentials.
 */
class InvalidLoginDataException extends SerializableException {
	public function __construct () {
		parent::__construct("Username or Password wrong.");
	}
}