<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Auth extends CI_Controller {
	
	private $sitename = "";
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
		$this->load->library('libauth');
	}
	
	public function index() {
		$this->load->view('welcome_message');
	}
	
	public function login() {
		$sess_id = $this->session->userdata('id');
		$data = array();
		$data['base_url'] = base_url();
		if (empty($sess_id)) {
			$config = array(
				array(
					'field'   => 'username', 
					'label'   => 'Username', 
					'rules'   => 'required'
				), array(
					'field'   => 'password', 
					'label'   => 'Password', 
					'rules'   => 'required'
				)
			);
			
			$this->form_validation->set_rules($config);
			
			if ($this->form_validation->run()) {
				try {
					$res = $this->redux_auth->login (
						$this->input->post('username'),
						$this->input->post('password')
					);	
					
					$data['status'] = 'ok';
					$data['success'] = true;
					$data['result'] = $res;
					
				} catch (SerializableException $e) {
					$data['status'] = 'error';
					$data['success'] = false;
					$data['result'] = $e->serialize();
					
				}
				
				/*switch($res){
					case 'NOT_ACTIVATED': 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied. Your account is not activated. Please contact the administrator';
						break;
					
					case 'BANNED': 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied. '.$this->session->flashdata('login');
						break;
					
					case 'false': 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied. Wrong Username or Password';
						break;
					
					case 'true': 
						$data['success'] = 'true';
						$data['msg'] = 'Access Granted. Welcome "'.strtoupper($this->input->post('username')).'".';
						break;
					
					default: 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied.';
				}
				//$this->session->set_flashdata($data);
				//redirect(base_url('administrator/login'), 'location	');*/
			} else {
				$e = new InvalidLoginDataException();
				$data['status'] = 'error';
				$data['success'] = false;
				$data['result'] = $e->serialize();
				//$data['success'] = 'false';
				//$data['msg'] = 'Invalid data, Please try again';
				//$this->session->set_flashdata($data);
				//redirect(base_url('administrator/login'), 'refresh');
			}
		} else {
			$e = new UserAlreadySignedInException();
			$data['status'] = 'error';
			$data['success'] = false;
			$data['result'] = $e->serialize();
			//redirect(base_url('administrator/main'), 'refresh');
		}

		$this->load->view('administrator/result', $data);
	}
	
	public function doLogout() {
		
	}
}

?>