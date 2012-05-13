<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Main extends CI_Controller {

	public function index()
	{
		$this->load->view('administrator/main');
	}
}

?>