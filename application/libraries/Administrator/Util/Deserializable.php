<?php if (!defined('APPPATH')) exit('No direct script access allowed');

interface Deserializable {
	/**
	 * Deserializes the entity from an array format
	 * @param $parameters array The serialized form of the entity to deserialize
	 */
	public function deserialize (array $parameters);
}

?>