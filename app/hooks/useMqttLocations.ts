"use client";

import { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import type { Location } from '@/data/locations';

interface MqttConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  topicPrefix?: string;
}

export function useMqttLocations(initialLocations: Location[], config: MqttConfig) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect(config.brokerUrl, {
      username: config.username,
      password: config.password,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      setConnected(true);

      // Subscribe to topics for each location
      const topicPrefix = config.topicPrefix || 'bikemap/locations/';
      locations.forEach((location) => {
        const topic = `${topicPrefix}${location.id}/occupied`;
        client.subscribe(topic, (err) => {
          if (err) {
            console.error(`Failed to subscribe to ${topic}:`, err);
          } else {
            console.log(`Subscribed to ${topic}`);
          }
        });
      });
    });

    client.on('message', (topic, message) => {
      try {
        const topicParts = topic.split('/');
        const locationId = topicParts[topicParts.length - 2]; // Extract location ID from topic

        const occupied = parseInt(message.toString(), 10);
        if (isNaN(occupied)) {
          console.warn(`Invalid occupied count received: ${message.toString()}`);
          return;
        }

        setLocations((prevLocations) =>
          prevLocations.map((loc) =>
            loc.id === locationId
              ? { ...loc, occupied: Math.max(0, Math.min(loc.capacity, occupied)) }
              : loc
          )
        );

        console.log(`Updated location ${locationId}: occupied = ${occupied}`);
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    client.on('error', (error) => {
      console.error('MQTT connection error:', error);
      setConnected(false);
    });

    client.on('offline', () => {
      console.log('MQTT client offline');
      setConnected(false);
    });

    client.on('reconnect', () => {
      console.log('MQTT client reconnecting...');
    });

    return () => {
      client.end();
    };
  }, [config.brokerUrl, config.username, config.password, config.topicPrefix]);

  return { locations, connected };
}