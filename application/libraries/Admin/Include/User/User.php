<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class User{
	
	private $userid = "";
	private $username = "";
	private $groupid = "";
	private $groupname = "";
	private $email = "";
	private $userstatus = "";
	private $lastlogin = "";
	private $lastip = "";
	private $loginCount = "";
	private $currentIp = "";
	private $bannedReason = "";
	private $lastActive = "";
	
	public function getUserID() {
		return $this->userid;
	}
	
	public function setUserID($id) {
		$this->userid = $id;
	}
	
	public function getUsername() {
		return $this->username;
	}
	
	public function setUsername($username) {
		$this->username = $username;
	}
	
	public function getGroupId() {
		return $this->groupid;
	}
	
	public function setGroupID($groupid) {
		$this->groupid = $groupid;
	}
	
	public function getGroupname() {
		return $this->groupname;
	}
	
	public function setGroupname($groupname) {
		$this->groupname = $groupname;
	}
	
	public function getEmail()
	{
		return $this->email;
	}
	
	public function setEmail($email)
	{
		$this->email = $email;
	}
	
	public function getStatus()
	{
		return $this->userstatus;
	}
	
	public function setStatus($status)
	{
		$this->userstatus = $status;
	}
	
	public function getLastLogin()
	{
		return $this->lastlogin;
	}
	
	public function setLastLogin($lastlogin)
	{
		$this->lastlogin = $lastlogin;
	}
	
	public function getLastIp()
	{
		return $this->lastip;
	}
	
	public function setLastIp($lastip)
	{
		$this->lastip = $lastip;
	}
	
	public function getLoginCount()
	{
		return $this->loginCount;
	}
	
	public function setLoginCount($loginCount)
	{
		$this->loginCount = $loginCount;
	}
	
	public function getCurrentIp()
	{
		return $this->currentIp;
	}
	
	public function setCurrentIp($currentIp)
	{
		$this->currentIp = $currentIp;
	}
	
	public function getBannedReason()
	{
		return $this->bannedReason;
	}
	
	public function setBannedReason($reason) {
		$this->bannedReason = $reason;
	}
	
	public function getLastActive() {
		return $this->lastActive;
	}
	
	public function setLastActive($lastActive) {
		$this->lastActive = $lastActive;
	}
	
	public function toArray () {
		$array = get_object_vars($this);
	    unset($array['_parent'], $array['_index']);
	    array_walk_recursive($array, function(&$property, $key){
	        if(is_object($property)
	        && method_exists($property, 'serialize')){
	            $property = $property->serialize();
	        }
	    });
    	return $array;
	}
	
}
?>
	