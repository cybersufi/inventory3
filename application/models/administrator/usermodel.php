<?php

class Usermodel extends CI_Model {
	
	private $user_tbl;
	private $group_tbl;
	private $banned_tbl;
	private $session_tbl;
	private $user_history;
	private $questions_tbl;
	
	const GET_DETAIL = 1;
	const BY_USERNAME = 2;
	
	public function __construct() {
		parent::__construct();
		$this->user_tbl = 'users';
		$this->group_tbl = 'groups';
		$this->banned_tbl = 'banned';
		$this->session_tbl = 'sessions';
		$this->user_history = 'users_history';
		$this->questions_tbl = 'questions';
	}
	
	public function userCount($filters=null) {
		$ul = $this->user_tbl;
    	$gl = $this->group_tbl;
    
    	$this->db->select($ul.'.id')
		->from($ul)
		->join($gl, $gl.'.id = '.$ul.'.group_id','left');
    
    	if ($filters != null) {
      		$this->db->where($filters, NULL, FALSE);
    	}	
	    
		return $this->db->count_all_results();
  	}
  
  	public function getUserList($start=0, $limit=0, $sorter=NULL, $filters=NULL) {
    	$ul = $this->user_tbl;
		$gl = $this->group_tbl;
		$bl = $this->banned_tbl;
    
    	$this->db->select($ul.'.id as uid, '.
					  $ul.'.username, '.
					  $ul.'.activation_code, '.
					  $ul.'.email, '.
					  $ul.'.lastlogin, '.
					  $ul.'.ipaddress, '.
					  $gl.'.title as groupname, '.
					  $bl.'.reason')
    	->from($ul)
    	->join($gl, $gl.'.id = '.$ul.'.group_id','left')
		->join($bl, $bl.'.id = '.$ul.'.banned_id','left');
    
	    if ($filters != NULL) {
	      	$this->db->where($filters, NULL, FALSE);
	    }
    	
		if ($sorter != NULL) {
			$this->db->order_by($sorter['property'], $sorter['direction']);
		}
		
	    if ($limit > 0) {
	      	$this->db->limit($limit,$start);
	    }
    
    	$res = $this->db->get();
    		
		if ($res->num_rows() > 0) {
			foreach ($res->result() as $row) {
				$user = new User();
				$user->setUserID($row->uid);
				$user->setUsername($row->username);
				$user->setGroupname($row->groupname);
				$user->setEmail($row->email);
				$user->setLastLogin($row->lastlogin);
				$user->setLastIp($row->ipaddress);
				$user->setStatus($row->activation_code);
				$user->setBannedReason($row->reason);
				$coll->add($user);
			}
			return $coll;
		} else {
			return null;
		}
  	}
	
	public function getCredentialByName($username) {
		$res = $this->db->select($this->user_tbl.'.password, '.
								 $this->user_tbl.'.hash')
		->from($this->user_tbl)
		->where($this->user_tbl.'.username', $username)
		->limit(1)
		->get();

		return $var = ($res->num_rows() > 0) ? $res->row() : null;
	}
	
	public function checkUserByID($id) {
		$ul = $this->user_tbl;
		$sql = $this->db->select($ul.'.id as uid')
           	->from($ul)
           	->where('id',$id)
           	->limit(1,0)
			->get();
		return $var = ($sql->num_rows() > 0) ? true : false;
  	}
  
  	public function checkUserByName($username) {
		$ul = $this->user_tbl;
		$sql = $this->db->select($ul.'.id')
           	->from($gl)
           	->where('username', $username)
           	->limit(1,0)
           	->get();
		return $var = ($sql->num_rows() > 0) ? true : false;
  	}
  
  	public function getUserById($id) {
    	$ul = $this->user_tbl;
		$gl = $this->group_tbl;
		$bl = $this->banned_tbl;

		$sql = $this->db->select($ul.'.id as uid, '.
						 $ul.'.username, '.
						 $ul.'.email, '.
						 $ul.'.activation_code, '.
						 $ul.'.lastlogin, '.
						 $ul.'.ipaddress, '.
						 $gl.'.id as groupid, '.
						 $gl.'.title as groupname, '.
						 $bl.'.reason')
 		->from($ul)
	 	->join($gl, $gl.'.id = '.$ul.'.group_id','left')
	 	->join($bl, $bl.'.id = '.$ul.'.banned_id','left')
      	->where($ul.'.id',$id)
      	->limit(1,0)
      	->get();

    	if ($sql->num_rows() > 0) {
			$row = $sql->row();
			$user = new User();
			$user->setUserID($row->uid);
			$user->setUsername($row->username);
			$user->setGroupID($row->groupid);
			$user->setGroupname($row->groupname);
			$user->setEmail($row->email);
			$user->setLastLogin($row->lastlogin);
			$user->setLastIp($row->ipaddress);
			$user->setStatus($row->activation_code);
			$user->setBannedReason($row->reason);
			return $user;
		} else {
			return null;
		}
  	}

  	public function getUserByName($username) {
    	$ul = $this->user_tbl;
		$gl = $this->group_tbl;
		$bl = $this->banned_tbl;

		$sql = $this->db->select($ul.'.id as uid, '.
						 $ul.'.username, '.
						 $ul.'.email, '.
						 $ul.'.activation_code, '.
						 $ul.'.lastlogin, '.
						 $ul.'.ipaddress, '.
						 $gl.'.id as groupid, '.
						 $gl.'.title as groupname, '.
						 $bl.'.reason')
 		->from($ul)
	 	->join($gl, $gl.'.id = '.$ul.'.group_id','left')
	 	->join($bl, $bl.'.id = '.$ul.'.banned_id','left')
      	->where($ul.'.username',$username)
      	->limit(1,0)
      	->get();

    	if ($sql->num_rows() > 0) {
			$row = $sql->row();
			$user = new User();
			$user->setUserID($row->uid);
			$user->setUsername($row->username);
			$user->setGroupID($row->groupid);
			$user->setGroupname($row->groupname);
			$user->setEmail($row->email);
			$user->setLastLogin($row->lastlogin);
			$user->setLastIp($row->ipaddress);
			$user->setStatus($row->activation_code);
			$user->setBannedReason($row->reason);
			return $user;
		} else {
			return null;
		}
  	}
	
	private function getLoginHistory1($userid) {
		$uh = $this->user_history;

    		$sql = $this->db->select($uh.'.datetime, '.
							 $uh.'.ipaddress ')
 		->from($uh)
		->where($uh.".userid", $userid)
		->order_by($uh.".datetime", "DESC")
	 	->get();
    		return $var = ($sql->num_rows() > 0) ? $sql : false;
	}

	public function activateUser ($userid) {
		$ul = $this->user_tbl;
		$this->db->where($ul.'.id', $userid)->update($ul, array($ul.'.activation_code' => 1));
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}
	
	protected function deactivateUser ($userid) {
		$ul = $this->user_tbl;
		$this->db->where($ul.'.id', $userid)->update($ul, array($ul.'.activation_code' => 0));
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}
	
	
	protected function banUser ($userid, $reason) {
		$ul = $this->user_tbl;
		$bt = $this->banned_tbl;
		$this->db->insert($bt, array('reason' => $reason)); 
		$banned_id = $this->db->insert_id();
		$this->db->where($ul.'.id', $userid)->update($ul, array($ul.'.banned_id' => $banned_id));
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}
	
	
	protected function unbanUser ($userid) {
		$ul = $this->user_tbl;
		$bt = $this->banned_tbl;
		$i = $this->db->select($ul.'.banned_id')	
		->from($ul)
		->where($ul.'.id', $userid)
		->limit(1)
		->get();
		$this->db->where($ul.'.id', $userid)->update($ul, array($ul.'.banned_id' => 0));
		if ($i->num_rows() > 0) {
			$row = $i->row();
			$banned_id = $row->banned_id;
			$this->db->delete($bt, array('id' => $banned_id));
			return true;
		}
		else {
			return false;
		}
	}

	public function insertPassword($password, $userid) {
		$ul = $this->user_tbl;

		$hash = sha1(microtime()); 

		$password = sha1($hash.$password); 

		$data = array(
           $ul.'.forgotten_password_code' => '0',
           $ul.'.password' => $password,
           $ul.'.hash' => $hash
        );

		$this->db->where($ul.'.id', $userid)->update($ul, $data); 
		
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}

	public function insertEncPassword($hash, $password, $userid) {
		$ul = $this->user_tbl; 

		$data = array(
           $ul.'.forgotten_password_code' => '0',
           $ul.'.password' => $password,
           $ul.'.hash' => $hash
        );

		$this->db->where($ul.'.id', $userid)->update($ul, $data); 
		
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}
	
	public function addUser($user) {
		$ul = $this->user_tbl;
		$user_data = array (
			'username' => $user-getUsername(),
			'email' => $user->getEmail(),
			'activation_code' => $user->getStatus(),
			'password'=> $user->getCredential()->getEncPassword(),
			'hash' => $user->getCredential()->getHash(),
		);
		$this->db->insert($ul, $user_data);
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}

	public function deleteUserById($userid) {
		$ul = $this->user_tbl;
		$bt = $this->banned_tbl;
		$qt = $this->questions_tbl;
		$i = $this->db->select($ul.'.banned_id, '.
							   $ul.'.question_id')	
		->from($ul)
		->where($ul.'.id', $userid)
		->limit(1)
		->get();
		
		if ($i->num_rows() > 0) {
			$row = $i->row();
			$banned_id = $row->banned_id;
			$questions_id = $row->question_id;
			
			$this->db->delete($bt, array('id' => $banned_id));
			$this->db->delete($qt, array('id' => $questions_id));
			$this->db->delete($ul, array('id' => $userid));
			return true;
		}
		else {
			return false;
		}
	}

	public function changeUserGroup($user_id, $group_id) {
		$this->db->where($this->user_tbl.'.id',$user_id)->update($this->user_tbl, array ($this->user_tbl.'.group_id' => $group_id));
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}	
}

?>