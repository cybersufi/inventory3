Ext.define('Administrator.Components.MessageLog', {
	extend: 'Administrator.Grid.BaseGrid',
	/*store: {
		model: "Administrator.Models.Message"
	},*/
	columns: [
		{header: "Message",  dataIndex: 'message', flex: 1},
		{header: "Date", dataIndex: 'date', width: 300},
		{header: "Severity", dataIndex: 'severity'}
	],
	proxy: {
	    type: 'memory',
		reader: {
	    	type: 'json',
			root: 'items'
	    }
	},
	sorters: [{
	    property: 'date',
		direction:'DESC'
	}]
});