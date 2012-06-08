Administrator.CategoryTreeStore = Ext.define("CategoryTreeStore",
{
	extend: "Ext.data.TreeStore",
    model: 'PartKeepr.Category',
    proxy: {
        type: 'ajax',
        url: Administrator.getBasePath()+'/Category',
        method: 'POST',
        extraParams: {
        	call: 'getCategories'
        },
        reader: {
        	type: 'json',
        	root: 'response'
        }
    },
    root: {
        text: 'Ext JS',
        id: 'src',
        expanded: true
    },
    constructor: function () {
    	this.proxy.extraParams.session = Administrator.getSession();
    	this.callParent();
    },
    folderSort: true
});