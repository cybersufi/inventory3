<?php  if (!defined('APPPATH')) exit('No direct script access allowed');

	class libauth extends auth_db {

		function __construct()
		{
			$this->ci =& get_Instance();
	
			$this->ci->config->load('lib_auth');
			$auth = $this->ci->config->item('auth');
			
			foreach($auth as $key => $value) {
				$this->$key = $value;
			}
			
			//$this->ci->email->initialize($this->mail);
		}

		public function register ($username, $password, $email, $question, $answer)
		{
			# Hash secret answer
			$answer = sha1($this->salt.$answer); 
			
			# Insert question and answer into the questions table
			$this->ci->db->insert($this->questions_table, array('question' => $question, 'answer' => $answer)); 
			
			# Retrieve the question_id
			$question_id = $this->ci->db->insert_id();
			
			# Generate dynamic salt
			$hash = sha1(microtime()); 
			
			# Insert the salt into database
			$this->ci->db->set('hash', $hash); 
			
			# Hash password
			$password_enc = sha1($this->salt.$hash.$password);
			
			$data = array
			(
				'username' 	=> $username,
				'password' 	=> $password_enc,
				'email'    	=> $email,
				'group_id'	=> $this->default_group,
				'question_id' => $question_id
			);
	
			$this->ci->db->set($data);
			
			/**
			 * Optional Columns Start
			**/
			if (!empty($this->optional_columns))
			{
				foreach($this->optional_columns as $key)
				{
					if (!$this->ci->input->post($key))
					{
						$optional[$key] = null;
					}
					else
					{
						$optional[$key] = $this->ci->input->post($key);
					}
				}
	
				$this->ci->db->set($optional);
			}
			/**
			 * Optional Columns Finish
			**/
	
			if (!$this->email_activation)
			{
				# Insert information into the users table
				$this->ci->db->insert($this->users_table);
				return 'REGISTRATION_SUCCESS';
			} else {
				# Generate activation code
				$key = sha1(microtime());
	
				$this->ci->db->set('activation_code', $key);
				$this->ci->db->insert($this->users_table);
				
				$message = str_replace('{activation_code}', $key, $this->email_activation_message); 
	
				$this->ci->email->from($this->mail_from_email, $this->mail_from_name);
				$this->ci->email->to($email);
				$this->ci->email->subject($this->email_activation_subject);
				$this->ci->email->message($message);
				$this->ci->email->send();
				
				return 'REGISTRATION_SUCCESS_EMAIL';
			}	
			return 'false';
		}
		
		public function unregister ($id)
		{
			$result = $this->_unregister($this->users_table, $this->banned_table, $this->questions_table, $id);
			if ($result){
				$var = $this->_check_userid($this->users_table, $id);
				if (!$var) 
					return 'UNREGISTER_SUCCESS';
				else
					return 'UNREGISTER_FAILED';
			}
			return 'false';
		}
		
		public function login ($username, $password)
		{			
			# Grab hash, password, id, activation_code and banned_id from database.
			$res = $this->_login($this->users_table, $this->banned_table, $username); 
	
			if ($res)
			{
				if ($res->activation_code == 0) {					
					$this->ci->session->set_flashdata('login', 'Your Account is Not Activated.');
					//return 'NOT_ACTIVATED';
					throw new UserInactiveException();
				}
				else if(!empty($res->banned_id)) {
					$this->ci->session->set_flashdata('login', 'Your Account _loginhas been banned for the following reason : '.$res->reason);
					//return 'BANNED';
					throw new UserBannedException($res->reason);
				}
				else
				{
					$password = sha1($this->salt.$res->hash.$password);
					if ($password === $res->password)
					{
						$data = $this->_set_user_history($this->users_table, $this->history_table, $res->id);
						$gid = $this->_get_group_id($this->groups_table, $this->users_table, $res->id);
						$priv = $this->_get_user_priv($this->groups_table, $this->users_table, $res->id);
						$this->ci->session->set_userdata(array(
							'id'=> $res->id, 
							'uname'=>$username, 
							'gid'=>$gid, 
							'issiteadmin'=>$priv['issiteadmin'],
							'isadmin'=>$priv['isadmin'],
							'isviewer'=>$priv['isviewer'],
							'lastlogin' => $data['datetime'],
							'ipaddress' => $data['ipaddress']));
						return 'true';
					}
				}
			}
			throw new InvalidLoginDataException();
		}
		
		public function logged_in ()
		{
			return $var = ($this->ci->session->userdata('id')) ? true : false; 
		}

		public function logout ()
		{
			$this->ci->session->unset_userdata('id');
			$this->ci->session->unset_userdata('uname');
			$this->ci->session->unset_userdata('gid');
			$this->ci->session->unset_userdata('issiteadmin');
			$this->ci->session->unset_userdata('isadmin');
			$this->ci->session->unset_userdata('isviewer');
			$this->ci->session->sess_destroy();
		}

		public function activate ($userid)
		{
			$activate = $this->_activate($this->users_table, $userid);
		
			return $var = ($activate) ? true : false;
		}
		
		public function deactivate ($userid)
		{
			$deactivate = $this->_deactivate($this->users_table, $userid);
		
			return $var = ($deactivate) ? true : false;
		}
		
		public function ban ($userid, $reason)
		{
			$ban = $this->_ban($this->users_table, $this->banned_table, $userid, $reason);
		
			return $var = ($ban) ? true : false;
		}
		
		public function unban ($userid)
		{
			$unban = $this->_unban($this->users_table, $this->banned_table, $userid);
		
			return $var = ($unban) ? true : false;
		}
		
		public function change_password($username, $old_password, $new_password)
		{
			$res = $this->_get_password($this->users_table, $username);
			if ($res) {
				$password = sha1($this->salt.$res->hash.$old_password);
				if ($password === $res->password)
				{
					$new_pass = sha1($this->salt.$res->hash.$new_password);
					$var = $this->_set_password($this->users_table, $username, $new_pass);
					return $var;
				}
			}
			return false;
	 	}
		
		public function reset_password($username, $new_password)
		{
			$res = $this->_get_password($this->users_table, $username);
			if ($res) {
				$new_pass = sha1($this->salt.$res->hash.$new_password);
				$var = $this->_set_password($this->users_table, $username, $new_pass);
				return $var;
			}
			return false;
	 	}
		
	 	
		public function forgotten_begin ($email)
		{
			if($this->_check_forgotten_code($this->users_table, $email))
			{
				# Verification code
				$key = sha1(microtime()); 
				
				# Inserts verification code into the users table
				$this->_insert_forgotten_code($this->users_table, $key, $email); 
	
				# Replace {key} with verification code
				$message = str_replace('{key}', $key, $this->forgotten_password_message);
				
				$this->ci->email->from($this->mail_from_email, $this->mail_from_name);
				$this->ci->email->to($email);
				$this->ci->email->subject($this->forgotten_password_subject);	
				$this->ci->email->message($message);
				$this->ci->email->send();
				
				return true;
			}
			else
			{
				return false;
			}
		}
		
		
		public function forgotten_process($key)
		{
			# Select question_id and question
			$question = $this->_select_question($this->users_table, $this->questions_table, $key);
				
			if ($question != false) {
				$data = array
				(
					'question_id' => $question->question_id
				);
				
				$this->ci->session->set_userdata($data);
					
				# Remove the forgotten code from the users table
				$this->_remove_forgotten_code($this->users_table, $key); 
				
				# Return the question to be used in a template
				return $question->question;
			}
			else {
				return false;
			}
			
		}	
		
		
		public function forgotten_end ($answer)
		{
			# Retrieve question_id
			$question_id = $this->ci->session->userdata('question_id'); 
			
			# Destroy question_id
			$this->ci->session->unset_userdata('question_id'); 
			
			# Retrieve questions answer
			$dbanswer = $this->_select_answer($this->users_table, $this->questions_table, $question_id); 
	
			if($dbanswer->answer === sha1($this->salt.$answer))
			{
				# New password
				$password = substr(sha1(microtime()), 0, 10); 
				
				# Insert new password
				$this->_insert_new_password($this->users_table, $password, $question_id); 
	
				# Replace {password} with new password
				$message = str_replace('{password}', $password, $this->new_password_message); 
				
				$this->ci->email->from($this->mail_from_email, $this->mail_from_name); 
				$this->ci->email->to($dbanswer->email);
				$this->ci->email->subject($this->new_password_subject);
				$this->ci->email->message($message);
				$this->ci->email->send();
	
				return true;
			}
	
			return false;
		}
		
		
		public function get_group($id){return $this->_get_group($this->groups_table, $this->users_table, $id);}
		
		
		public function check_username($username){return $this->_check_username($this->users_table, $username);}
		
		
		public function check_email($email){return $this->_check_email($this->users_table, $email);}
	
	}
	
	class auth_db {

		protected function _activate ($users_tbl, $userid) {
			$this->ci->db->where($users_tbl.'.id', $userid)->update($users_tbl, array($users_tbl.'.activation_code' => 1));
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}
		
		protected function _deactivate ($users_tbl, $userid)
		{
			$this->ci->db->where($users_tbl.'.id', $userid)->update($users_tbl, array($users_tbl.'.activation_code' => 0));
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}
		
		
		protected function _ban ($users_tbl, $ban_tbl, $userid, $reason)
		{
			$this->ci->db->insert($ban_tbl, array('reason' => $reason)); 
			$banned_id = $this->ci->db->insert_id();
			$this->ci->db->where($users_tbl.'.id', $userid)->update($users_tbl, array($users_tbl.'.banned_id' => $banned_id));
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}
		
		
		protected function _unban ($users_tbl, $banned_tbl, $userid)
		{
			$i = $this->ci->db->select($users_tbl.'.banned_id')	
			->from($users_tbl)
			->where($users_tbl.'.id', $userid)
			->limit(1)
			->get();
			$this->ci->db->where($users_tbl.'.id', $userid)->update($users_tbl, array($users_tbl.'.banned_id' => 0));
			if ($i->num_rows() > 0) {
				$row = $i->row();
				$banned_id = $row->banned_id;
				
				$this->ci->db->delete($banned_tbl, array('id' => $banned_id));
				return true;
			}
			else {
				return false;
			}
		}

		protected function _insert_new_password($users_tbl, $password, $question_id)
		{
			# New hash
			$hash = sha1(microtime()); 

			# New hashed password
			$password = sha1($this->salt.$hash.$password); 

			$data = array(
	           $users_tbl.'.forgotten_password_code' => '0',
	           $users_tbl.'.password' => $password,
	           $users_tbl.'.hash' => $hash
	        );
	
			$this->ci->db->where($users_tbl.'.question_id', $question_id)->update($users_tbl, $data); 
			
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}

		
		protected function _insert_forgotten_code($users_tbl, $key, $email)
		{
			$this->ci->db->where($users_tbl.'.email', $email)->update($users_tbl, array('forgotten_password_code' => $key)); 
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}

		
		protected function _check_forgotten_code($users_tbl, $email)
		{
		 	$i = $this->ci->db->select($users_tbl.'.forgotten_password_code')->from($users_tbl)->where($users_tbl.'.email', $email)->get();
		 	return $var = ($i->num_rows() > 0) ? true : false;
		}

		
		protected function _remove_forgotten_code($users_tbl, $key)
		{
		 	$this->ci->db->where($users_tbl.'.forgotten_password_code', $key)->update($users_tbl, array($users_tbl.'.forgotten_password_code' => 0));
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}
		
		protected function _check_username ($users_tbl, $username)
		{
			$i = $this->ci->db->select($users_tbl.'.username')->from($users_tbl)->where($users_tbl.'.username', $username)->get();
			return $var = ($i->num_rows() > 0) ? true : false;
		}
		
		protected function _check_userid ($users_tbl, $userid)
		{
			$i = $this->ci->db->select($users_tbl.'.id')->from($users_tbl)->where($users_tbl.'.id', $userid)->get();
			return $var = ($i->num_rows() > 0) ? true : false;
		}
		
		protected function _check_email ($users_tbl, $email)
		{
			$i = $this->ci->db->select($users_tbl.'.email')->from($users_tbl)->where($users_tbl.'.email', $email)->get();
			return $var = ($i->num_rows() > 0) ? true : false;
		}
		
		protected function _get_password($users_tbl, $username) {
			$i = $this->ci->db->select($users_tbl.'.password, '.
									   $users_tbl.'.hash')
			->from($users_tbl)
			->where($users_tbl.'.username', $username)
			->limit(1)
			->get();
	
			return $var = ($i->num_rows() > 0) ? $i->row() : false;
		}
		
		protected function _set_password($users_tbl, $username, $newpass) {
			$this->ci->db->where($users_tbl.'.username', $username)->update($users_tbl, array($users_tbl.'.password' => $newpass));
			return $var = ($this->ci->db->affected_rows() > 0) ? true : false;
		}
		
		protected function _get_group ($groups_tbl, $users_tbl, $id)
		{
			$i = $this->ci->db->select($groups_tbl.'.title')
			->from($groups_tbl)
			->join($users_tbl, $groups_tbl.'.id = '.$users_tbl.'.group_id', 'left')
			->where($users_tbl.'.id', $id)
			->limit(1)
			->get();
	
			return $var = ($i->num_rows() > 0) ? $i->row()->title : false;
		}
		
		protected function _get_user_history ($users_tbl, $history_tbl, $id) {
			$i = $this->ci->db->select($users_tbl.'.lastlogin, '.
								  	   $users_tbl.'.ipaddress')
			->from($users_tbl)
			->where($users_tbl.'.id', $id)
			->limit(1)
			->get();
		}
		
		protected function _set_user_history ($users_tbl, $history_tbl, $id) {
			//$ip = $_SERVER["REMOTE_ADDR"];
			$ip = $this->ci->input->ip_address();
			$date = date('U');
			$i = $this->ci->db->select($users_tbl.'.lastlogin, '.
								  $users_tbl.'.ipaddress')
				->from($users_tbl)
				->where($users_tbl.'.id', $id)
				->limit(1)
				->get();
			
			$data =  array(
				'lastlogin' => $date,
				'ipaddress' => $ip
			);
			
			$this->ci->db->where($users_tbl.'.id', $id)->update($users_tbl, $data);
			
			$data = array (
				'userid' 	=> $id,
				'datetime' 	=> $date,
				'ipaddress' => $ip
			);
			$this->ci->db->insert($history_tbl, $data);
			
			$data = array(
				'datetime' => $i->row()->lastlogin,
				'ipaddress' => $i->row()->ipaddress
			);
			
			return $data;
		}
		
		protected function _get_group_id ($groups_tbl, $users_tbl, $id)
		{
			$i = $this->ci->db->select($groups_tbl.'.id')
			->from($groups_tbl)
			->join($users_tbl, $groups_tbl.'.id = '.$users_tbl.'.group_id', 'left')
			->where($users_tbl.'.id', $id)
			->limit(1)
			->get();
	
			return $var = ($i->num_rows() > 0) ? $i->row()->id : false;
		}
		
		protected function _get_user_priv ($groups_tbl, $users_tbl, $id)
		{
			$i = $this->ci->db->select($groups_tbl.'.issiteadmin, '.$groups_tbl.'.isadmin, '.$groups_tbl.'.isviewer')
			->from($groups_tbl)
			->join($users_tbl, $groups_tbl.'.id = '.$users_tbl.'.group_id', 'left')
			->where($users_tbl.'.id', $id)
			->limit(1)
			->get();
			
			$priv = null;
			
			if ($i->num_rows() > 0) {
				$priv = array();
				$priv['issiteadmin'] = $i->row()->issiteadmin;
				$priv['isadmin'] = $i->row()->isadmin;
				$priv['isviewer'] = $i->row()->isviewer;
			}
			
			return ($priv != null) ? $priv : false;
		}
		
		protected function _select_question ($users_tbl, $questions_tbl, $forgotten_password_code)
		{
			$i = $this->ci->db->select($users_tbl.'.question_id, '.
									   $questions_tbl.'.question')
			->from($users_tbl)
			->join($questions_tbl, $users_tbl.'.question_id = '.$questions_tbl.'.id', 'left')
			->where($users_tbl.'.forgotten_password_code', $forgotten_password_code)
			->limit(1)
			->get();
			
			return $var = ($i->num_rows() > 0) ? $i->row() : false;
		}
		
		protected function _select_answer ($users_tbl, $questions_tbl, $id)
		{
			$i = $this->ci->db->select($users_tbl.'.email,'.$questions_tbl.'.answer')
			->from($users_tbl)
			->join($questions_tbl, $users_tbl.'.question_id = '.$questions_tbl.'.id', 'left')
			->where($users_tbl.'.id', $id)
			->limit(1)
			->get();
			
			return $var = ($i->num_rows() > 0) ? $i->row() : false;
		}
		
		protected function _login ($users_tbl, $banned_tbl, $username)
		{
			$i = $this->ci->db->select($users_tbl.'.password, '.
									   $users_tbl.'.hash, '.
									   $users_tbl.'.id, '.
									   $users_tbl.'.activation_code, '.
									   $users_tbl.'.banned_id, '.
									   $banned_tbl.'.reason')
			->from($users_tbl)
			->join($banned_tbl, $users_tbl.'.banned_id = '.$banned_tbl.'.id', 'left')
			->where($users_tbl.'.username', $username)
			->limit(1)
			->get();
	
			return $var = ($i->num_rows() > 0) ? $i->row() : false;
		}
		
		protected function _unregister ($users_tbl, $banned_tbl, $questions_tbl, $id) {
			
			$i = $this->ci->db->select($users_tbl.'.banned_id, '.
									   $users_tbl.'.question_id')	
			->from($users_tbl)
			->where($users_tbl.'.id', $id)
			->limit(1)
			->get();
			
			if ($i->num_rows() > 0) {
				$row = $i->row();
				$banned_id = $row->banned_id;
				$questions_id = $row->question_id;
				
				$this->ci->db->delete($banned_tbl, array('id' => $banned_id));
				$this->ci->db->delete($questions_tbl, array('id' => $questions_id));
				$this->ci->db->delete($users_tbl, array('id' => $id));
				return true;
			}
			else {
				return false;
			}
		}
	}