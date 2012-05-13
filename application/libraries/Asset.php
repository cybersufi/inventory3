<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * CodeIgniter Asset Library
 *
 * Provides simple functions to include CSS, JavaScript & Image assets.
 * By using this library, you will have cleaner view files.
 *
 * @package		CodeIgniter
 * @subpackage	Libraries
 * @category	Libraries
 * @author		Danijel Bešlić
 * @link		http://codeigniter.com/wiki/Asset_Library/
 */

class Asset{

	private $CI;
	private $base_url;
	private $asset_url;
	
	function asset()
	{
		$this->CI =& get_instance();
		$this->base_url = $this->CI->config->item('base_url');
		$this->asset_url = $this->base_url . 'assets/';
	}
	
	function stylesheet ( $asset_name = NULL, $media = NULL )
	{
		if ( $asset_name != NULL )
		{	
			$asset_url = $this->asset_url . 'css/';
			$stylesheet = 	'<link href="' 	. 
							$asset_url		.
							$asset_name			.
							'.css" rel="stylesheet" type="text/css"';
	
			if ($media != NULL)
			{
				$stylesheet = $stylesheet . 	' media="' 	. 
												$media 		.
												'" />';
			}
			else
			{
				$stylesheet = $stylesheet . ' />';
			}
			
			echo $stylesheet;
		}
	}
	
	function javascript ( $asset_name = NULL )
	{
		if ( $asset_name != NULL )
		{
			$asset_url = $this->asset_url . 'js/';
			$javascript = 	'<script type="text/javascript" src="'	. 
							$asset_url								.
							$asset_name								.
							'.js"></script>';
							
			echo $javascript;
		}
	}
	
	function image ( $asset_name = NULL, $alt = NULL, $additional_elements = NULL )
	{
		if ( $asset_name != NULL)
		{
			$asset_url = $this->asset_url . 'images/';
			
			$image = 	'<img src="'	. 
						$asset_url		.
						$asset_name		.
						'"';
			
			if ( $alt != NULL )
			{
				$image =	$image		.
							' alt="'	.
							$alt		.
							'"';
			}
			
			if ( $additional_elements != NULL)
			{
				foreach ($additional_elements as $element=>$value)
				{
					$image = 	$image					.
								' ' 					.
								$element 				.
								'='						.
								'"'						.
								$value					.
								'"';
				}
			}

			$image = $image . ' />';
			
			echo $image;
		}
	}
}