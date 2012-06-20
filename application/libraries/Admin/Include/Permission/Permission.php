<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class Permission {
	private $id;
	private $name;
	private $key;

	function __construct($id=null, $name=null, $key=null) {
		$this->id = $id;
		$this->name = $name;
		$this->key = $key;
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

	public function getKey()
	{
		return $this->key;
	}

	public function setKey($permKey)
	{
		$this->key = $permKey;
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