function createDefaultPanels() {
    // Ant Spawn Panel (vertical layout with ant spawning options)
    this.panels.set('ant_spawn', new DraggablePanel({
      id: 'ant-Spawn-panel',
      title: 'Ant Government Population Manager (🐜)',
      position: { x: 20, y: 80 },
      size: { width: 140, height: 280 },
      scale: 1.0, // Initial scale
      buttons: {
        layout: 'vertical',
        spacing: 3,
        buttonWidth: 120,
        buttonHeight: 24,
        items: [
          {
            caption: 'Spawn 1 Ant',
            onClick: () => this.spawnAnts(1),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Spawn 10 Ants',
            onClick: () => this.spawnAnts(10),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#32CD32' }
          },
          {
            caption: 'Spawn 100 Ants',
            onClick: () => this.spawnAnts(100),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Spawn 1000 Ants (Don\'t do this!)',
            onClick: () => this.spawnAnts(1000),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#218221ff' }
          },
          {
            caption: 'Kill 1 Ant',
            onClick: () => this.killAnts(1),
            style: ButtonStyles.DANGER
          },
          {
            caption: 'Kill 10 Ants',
            onClick: () => this.killAnts(10),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#DC143C' }
          },
          {
            caption: 'Kill 100 Ants',
            onClick: () => this.killAnts(100),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#B22222' }
          },
          {
            caption: 'Clear All Ants',
            onClick: () => this.clearAnts(),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#8B0000' }
          }/*,
          {
            caption: 'Pause/Play',
            onClick: () => this.togglePause(),
            style: ButtonStyles.WARNING
          },
          {
            caption: 'Debug Info',
            onClick: () => this.toggleDebug(),
            style: ButtonStyles.PURPLE
          }*/
        ]
      }
    }))
}