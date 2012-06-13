<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class User extends Collections implements Serializable {
	
	function __construct() {
		$this::parent();
	}
	
	public function serialize () {
		$array = get_object_vars($this);
	    //unset($array['_parent'], $array['_index']);
	    array_walk_recursive($array, function(&$property, $key){
	        if(is_object($property) && method_exists($property, 'serialize')){
	            $property = $property->serialize();
	        }
	    });
    	return $array;
	}
	
}

?>