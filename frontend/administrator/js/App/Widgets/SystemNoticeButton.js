Ext.define('Administrator.Widgets.SystemNoticeButton', {
	extend: 'Administrator.Widgets.FadingButton',
	icon: 'resources/fugue-icons/icons/service-bell.png',
	tooltip: "Unacknowledged System Notices",
	initComponent: function () {
		this.callParent();
		
		this.on("render", this.startFading, this);
		this.on("click", this.onClick, this);
	},
	onClick: function () {
		PartKeepr.getApplication().menuBar.showSystemNotices();
	}
});