Ext.define('Administrator.Components.MenuBar', {
	extend: 'Ext.toolbar.Toolbar',
	initComponent: function () {
		this.ui = "mainmenu";
		
		// @todo this is an ugly list of configurations. Refactor this in a cleaner way.
		
		this.editMenu = Ext.create('Ext.menu.Menu', {
			items: [{
						text: 'Projects',
						icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/drill.png',
						handler: this.editProjects
					},
			        {
			        	text: 'Footprints',
			        	icon: 'resoAdministrator.getResourcePath() + urces/fugue-icons/icons/fingerprint.png',
			        	handler: this.editFootprints
			        },{
			        	text: 'Manufacturers',
			        	icon: Administrator.getResourcePath() + 'resources/silkicons/building.png',
			        	handler: this.editManufacturers
			        },{
			        	text: 'Storage Locations',
			        	icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/wooden-box.png',
			        	handler: this.editStorageLocations
			        },{
			        	text: 'Distributors',
			        	icon: Administrator.getResourcePath() + 'resources/silkicons/lorry.png',
			        	handler: this.editDistributors
			        },{
			        	text: 'Users',
			        	id: 'edit-users',
			        	handler: this.editUsers,
			        	icon: Administrator.getResourcePath() + "resources/silkicons/user.png"
			        },{
			        	text: 'Part Measure Units',
			        	handler: this.editPartUnits,
			        	icon: Administrator.getResourcePath() + "resources/fugue-icons/icons/ruler.png"
			        },{
			        	text: "Units",
			        	handler: this.editUnits,
			        	icon: Administrator.getResourcePath() + 'resources/icons/unit.png'
			        }]
		});
		
		this.viewMenu = Ext.create('Ext.menu.Menu', {
			items: [{
			        	text: "Statistics",
			        	icon: Administrator.getResourcePath() + 'resources/silkicons/chart_bar.png',
			        	menu: [
							{
								text: "Summary",
								handler: this.showStatisticsSummary,
								icon: Administrator.getResourcePath() + 'resources/silkicons/chart_bar.png'
							},{
								text: "Chart",
								handler: this.showStatisticsChart,
								icon: Administrator.getResourcePath() + 'resources/silkicons/chart_bar.png'
							}]
			        },
					{
						text: "System Information",
						handler: this.showSystemInformation,
						icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/system-monitor.png'
					},{
						text: "Project Reports",
						handler: this.showProjectReports,
						icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/drill.png'
					},{
						text: "System Notices",
						handler: this.showSystemNotices,
						icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/service-bell.png'
					},{
						text: "Stock History",
						handler: this.showStockHistory,
						icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/notebook.png'
					}
					
			        ]
		});
		
		this.systemMenu = Ext.create('Ext.menu.Menu', {
			items: [
			{
	        	text: 'Disconnect',
	        	icon: Administrator.getResourcePath() + 'resources/silkicons/disconnect.png',
	        	handler: this.disconnect
	        },{
	        	text: "User Preferences",
	        	icon: Administrator.getResourcePath() + 'resources/fugue-icons/icons/gear.png',
	        	handler: this.showUserPreferences
	        }
			]
		});
		
		this.items = [{
			text: "System",
			menu: this.systemMenu
		},{
			text: 'Edit',
			menu: this.editMenu 
		},{
			text: 'View',
			menu: this.viewMenu 
		},
		'->',
		{
			xtype: 'tbtext',
			cls: 'partkeepr-logo-align',
			text: '<div class="partkeepr-logo">PartKeepr</div>',
			width: 200
		}];
		
		
		
		this.callParent();
	},
	showUserPreferences: function () {
		var j = new PartKeepr.UserPreferencePanel({
			iconCls: 'icon-gear',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	disconnect: function () {
		PartKeepr.getApplication().logout();
	},
	/**
	 * Shows the system information window
	 */
	showSystemInformation: function () {
		var j = Ext.create("PartKeepr.SystemInformationGrid", {
			title: "System Information",
			iconCls: 'icon-system-monitor',
			closable: true,
			padding: "5 5 5 5"
		});
		
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showStatisticsSummary: function () {
		var j = Ext.create("PartKeepr.CurrentStatisticsPanel", {
			iconCls: 'icon-chart-bar',
			closable: true
		});
		
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showStatisticsChart: function () {
		var j = Ext.create("PartKeepr.StatisticsChartPanel", {
			iconCls: 'icon-chart-bar',
			closable: true
		});
		
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editStorageLocations: function () {
		var j = Ext.create("PartKeepr.StorageLocationEditorComponent", {
			title: "Storage Locations",
			iconCls: 'icon-wooden-box',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editUnits: function () {
		var j = Ext.create("PartKeepr.UnitEditorComponent", {
			title: "Units",
			iconCls: 'icon-unit',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editManufacturers: function () {
		var j = Ext.create("PartKeepr.ManufacturerEditorComponent", {
			title: "Manufacturers",
			iconCls: 'icon-building',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editFootprints: function () {
		var j = Ext.create("PartKeepr.FootprintEditorComponent", {
			title: "Footprints",
			iconCls: 'icon-footprint',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editDistributors: function () {
		var j = Ext.create("PartKeepr.DistributorEditorComponent", {
			title: "Distributors",
			iconCls: 'icon-lorry',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editUsers: function () {
		var j = Ext.create("PartKeepr.UserEditorComponent", {
			title: "Users",
			iconCls: 'icon-user',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editPartUnits: function () {
		var j = Ext.create("PartKeepr.PartUnitEditorComponent", {
			title: "Part Measurement Units",
			iconCls: 'icon-ruler',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editProjects: function () {
		var j = Ext.create("PartKeepr.ProjectEditorComponent", {
			title: "Projects",
			iconCls: 'icon-drill',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showProjectReports: function () {
		var j = Ext.create("PartKeepr.ProjectReportView", {
			title: "Project Reports",
			iconCls: 'icon-drill',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showSystemNotices: function () {
		var j = Ext.create("PartKeepr.SystemNoticeEditorComponent", {
			title: "System Notices",
			iconCls: 'icon-service-bell',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showStockHistory: function () {
		var j = Ext.create("PartKeepr.StockHistoryGrid", {
			title: "Stock History",
			iconCls: 'icon-notebook',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	displayComponent: function (component) {
		var j = Ext.create(component.type, {
			title: component.title,
			iconCls: component.iconCls,
			closable: component.closable 
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	}
});
	