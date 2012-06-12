<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class User implements Serializable {
	
	private $userid = "";
	private $username = "";
	private $groupid = "";
	private $groupname = "";
	private $email = "";
	private $userstatus = "";
	private $lastlogin = "";
	private $lastip = "";
	
	
	
	
	public function serialize () {
		$array = get_object_vars($this);
	    unset($array['_parent'], $array['_index']);
	    array_walk_recursive($array, function(&$property, $key){
	        if(is_object($property)
	        && method_exists($property, 'toArray')){
	            $property = $property->toArray();
	        }
	    });
    	return $array;
	}
	
}

?>
	