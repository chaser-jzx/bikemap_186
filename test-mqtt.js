// Test MQTT connection
const testMqttConnection = async () => {
  const mqtt = require('mqtt');

  const client = mqtt.connect('wss://3682d4313bdd4188bd25bbd243529ace.s1.eu.hivemq.cloud:8884/mqtt', {
    username: 'bikemap_186',
    password: 'M4kerspace',
  });

  client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    client.subscribe('bike/load', (err) => {
      if (err) {
        console.error('❌ Subscribe error:', err);
      } else {
        console.log('✅ Subscribed to bike/load');
      }
    });
  });

  client.on('error', (error) => {
    console.error('❌ MQTT connection error:', error);
  });

  client.on('message', (topic, message) => {
    console.log('📨 Received:', topic, message.toString());
  });

  // Test publish
  setTimeout(() => {
    client.publish('bike/load', '5');
    console.log('📤 Published test message: 5');
  }, 2000);
};

// Run the test
testMqttConnection();