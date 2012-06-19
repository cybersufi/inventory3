<?php if (!defined('APPPATH')) exit('No direct script access allowed');

class Credential {

	private $hash = "";
	private $password = "";

	function __construct() {
		$this->hash = $this->createHash();
	}

	public function createHash() {
		return sha1(microtime());
	}

	public function getHash() {
		return $this->hash;
	}

	public function setHash($hash) {
		$this->hash = $hash;
	}

	public function getEncPassword() {
		return $this->password;
	}

	public function setBlankPassword($password) {
		$this->hash = ($this->hash == null) ? $this->createHash : $this->hash;
		$this->password = sha1($this->hash.$password);
	}

	public function setPassword($password) {
		$this->password = $password;
	}

}

?>