<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

/**
 * Is thrown when the user has given wrong credentials.
 */
class InvalidDataException extends SerializableException {
	public function __construct () {
		parent::__construct("Invalid data. Please try again");
	}
}