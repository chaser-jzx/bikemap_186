#include <WiFi.h>
#include <PubSubClient.h>

// wifi
const char* ssid = "Berkeley-IoT";
const char* password = "UC&D6kb2";

// hivemq setup
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "bikemap/locations/1/occupied"; // Change "1" to your location ID

WiFiClient espClient;
PubSubClient client(espClient);

// sensor pins
const int sensorPin = 34; // Example: analog pin for distance sensor
const int capacity = 8;   // Total capacity for this location

void setup() {
  Serial.begin(115200);

  // connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  // setup MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

int readOccupiedSpaces() {
  // Replace this with your actual sensor reading logic
  // This example assumes an analog distance sensor
  int sensorValue = analogRead(sensorPin);

  // Convert sensor reading to occupied spaces
  // You'll need to calibrate this based on your sensor
  // For example, if sensor value increases with occupancy:
  int occupied = map(sensorValue, 0, 4095, 0, capacity);

  // Ensure occupied is within valid range
  occupied = constrain(occupied, 0, capacity);

  return occupied;
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read sensor and publish every 30 seconds
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 30000) {
    int occupied = readOccupiedSpaces();

    char payload[10];
    sprintf(payload, "%d", occupied);

    client.publish(mqtt_topic, payload);
    Serial.print("Published: ");
    Serial.println(payload);

    lastPublish = millis();
  }

  delay(1000);
}