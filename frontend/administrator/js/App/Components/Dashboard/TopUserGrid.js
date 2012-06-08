/**
 * This class is the main part list grid.
 * 
 */
Ext.define('Administrator.Components.Dashboard.TopUserGrid', {
	extend: 'Administrator.Components.Grid.BaseGrid',
	alias: 'widget.TopUserGrid',
	
	// We want to display the texts for the add/delete buttons
	buttonTextMode: 'show',
	enableTopToolbar: true,
	stripeRows: true,
    autoScroll: false,
    invalidateScrollerOnRefresh: true,
	initComponent: function () {
		
		this.addEvents(
				/**
	             * @event itemSelect
	             * Fires if a record was selected within the grid.
	             * @param {Object} record The selected record
	             */
				"itemSelect",
				
				/**
	             * @event itemDeselect
	             * Fires if a record was deselected within the grid.
	             * @param {Object} record The deselected record
	             */
				"itemDeselect",
				
				/**
	             * @event gridRefresh
	             * Fires if a refresh button pressed.
	             */
				"gridRefresh");
		
		this.getSelectionModel().on("select", 	this._onItemSelect, 	this);
		this.getSelectionModel().on("deselect", this._onItemDeselect, 	this);
		
		this.searchField = Ext.create("Ext.ux.form.SearchField",{
			store: this.store
		});
		
		this.groupingFeature = Ext.create('Ext.grid.feature.Grouping',{
			//enableGroupingMenu: false,
	        groupHeaderTpl: '{name} ({rows.length} User(s))'
	    });

		// Create the columns
		this.defineColumns();
		
		
		this.features = [this.groupingFeature];
		
		// Bugfix for scroller becoming detached.
		// @todo Remove with ExtJS 4.1
		this.on('scrollershow', function(scroller) {
  			if (scroller && scroller.scrollEl) {
		    	scroller.clearManagedListeners(); 
		    	scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
		  	}
		});
		
		this.refreshButton = Ext.create("Ext.button.Button", {
			disabled: false,
			handler: Ext.bind(function () {
        		this.fireEvent("gridRefresh");
        	}, this),
			tooltip: "Refresh grid data",
			text: "Refresh Data",
			icon: Administrator.getResourcePath() + 'resources/silkicons/brick_link.png'
		});
		
		this.topToolbar = Ext.create("Ext.toolbar.Toolbar",{
			dock: 'top',
			enableOverflow: true,
			items: [
				this.refreshButton,
				{ xtype: 'tbfill' },
				this.searchField
			]
		});
		
		this.bottomToolbar = Ext.create("Ext.toolbar.Paging", {
			store: this.store,
			enableOverflow: true,
			dock: 'bottom',
			displayInfo: false
		});
		
		this.bottomToolbar.add({
			xtype: 'button',
			tooltip: "Expand all Groups",
			icon: this.expandRowButtonIcon,
			listeners: {
				scope: this.groupingFeature,
				click: this.groupingFeature.expandAll	
			}
			
		});
		
		this.bottomToolbar.add({
			xtype: 'button',
			tooltip: "Collapse all Groups",
			icon: this.collapseRowButtonIcon,
			listeners: {
				scope: this.groupingFeature,
				click: this.groupingFeature.collapseAll	
			}
		});
		
		this.dockedItems = new Array();
		
		this.dockedItems.push(this.bottomToolbar);
	
		if (this.enableTopToolbar) {
			this.dockedItems.push(this.topToolbar);	
		}
		
		// Initialize the panel
		this.callParent();
	},
	/**
	 * Called when an item was selected
	 */
	_onItemSelect: function (selectionModel, record) {
		this.fireEvent("itemSelect", record);
	},
	/**
	 * Called when an item was deselected
	 */
	_onItemDeselect: function (selectionModel, record) {
		this.fireEvent("itemDeselect", record);
	},
	/**
	 * Defines the columns used in this grid.
	 */
	defineColumns: function () {
		this.columns = [{
			header: "",
	  		dataIndex: "",
		  	width: 30,
		  	renderer: this.iconRenderer
		},{
		  	header: "User ID",
	  		dataIndex: 'userid',
		  	flex: 1,
		  	minWidth: 50,
		  	renderer: Ext.util.Format.htmlEncode
	  	},{
		  	header: "User Name",
	  		dataIndex: 'username',
		  	flex: 1,
		  	minWidth: 200,
		  	renderer: Ext.util.Format.htmlEncode
		},{
		  	header: "User Group",
	  		dataIndex: 'usergroup',
		  	flex: 1,
		  	minWidth: 200,
		  	renderer: Ext.util.Format.htmlEncode
		},{
		  	header: "Total",
	  		dataIndex: 'total',
		  	flex: 1,
		  	minWidth: 75,
		  	renderer: Ext.util.Format.htmlEncode
		}];
	},
	
	/**
	 * Used as renderer for the icon column.
	 */
	iconRenderer: function (val,q,rec)
	{
		var ret = "";
		if (rec.get("attachmentCount") > 0) {
			ret += '<img src="resources/diagona-icons/icons/10/190.png" style="margin-top: 2px;" alt="'+i18n("Has attachments")+'" title="'+i18n("Has attachments")+'"/>';
		}
		
		return ret;
	},
	/**
	 * Sets the category. Triggers a store reload with a category filter.
	 */
	setCategory: function (category) {
		this.currentCategory = category;
		
		var proxy = this.store.getProxy();
		
		proxy.extraParams.category = category;
		this.searchField.onTrigger1Click();
		
		this.store.currentPage = 1;
		this.store.load({ start: 0});
	},
	
	reloadGrid: function () {
		// Simply reload the store for now
		this.store.load();
	},
});