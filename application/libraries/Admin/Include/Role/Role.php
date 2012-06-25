<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class Role {

	private $id;
	private $name;
	private $permissionList;

	function __construct($id=null, $name=null) {
		$this->id = $id;
		$this->name = $name;
	}

	public function getId() {
		return $this->id;
	}

	public function setId($permId) {
		$this->id = $permId;
	}

	public function getName()
	{
		return $this->name;
	}

	public function setName($permName)
	{
		$this->name = $permName;
	}

	public function toArray () {
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