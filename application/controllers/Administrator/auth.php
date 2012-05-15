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
			} else {
				$e = new InvalidLoginDataException();
				$data['status'] = 'error';
				$data['success'] = false;
				$data['result'] = $e->serialize();
			}
		} else {
			$e = new UserAlreadySignedInException();
			$data['status'] = 'error';
			$data['success'] = false;
			$data['result'] = $e->serialize();
		}

		$this->load->view('administrator/result', $data);
	}
	
	public function doLogout() {
		
	}
}

?>