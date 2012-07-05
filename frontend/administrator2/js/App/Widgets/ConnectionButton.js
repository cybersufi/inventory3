Ext.define('Administrator.Widgets.ConnectionButton', {
	extend: 'Ext.Button',
	connectedIcon: Administrator.getResourcePath() + 'resources/silkicons/connect.png',
	disconnectedIcon: Administrator.getResourcePath() + 'resources/silkicons/disconnect.png',
	cls: 'x-btn-icon',
	icon: Administrator.getResourcePath() + 'resources/silkicons/disconnect.png',
	//tooltip: i18n("Disconnected"),
	setConnected: function () {
		this.setIcon(this.connectedIcon);
		//this.setTooltip(i18n("Connected"));
	},
	setDisconnected: function () {
		this.setIcon(this.disconnectedIcon);
		//this.setTooltip(i18n("Disconnected"));
	}
});

