<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class UserCollection extends Collections {
	
	public function __construct()
	{
		parent::__construct(gettype(new User));
	}
	
	public function toArray () {
		$array = array();
		$it = $this->getIterator();
		foreach ($it as $value) {
			array_push($array, $value->toArray());
		}
		
    	return $array;
	}
	
}

?>