Ext.define("Administrator.Models.Message", {
	extend: "Ext.data.Model",
	fields: [{
		name: 'message', 
		type: 'string' 
	}, {	
		name: 'severity',
		type: 'string'
	},{ 
		name: 'date', 
		type: 'date' 
	}]
});