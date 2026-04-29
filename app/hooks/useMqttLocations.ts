"use client";

import { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import type { Location } from '@/data/locations';

interface MqttConfig {
  brokerUrl: string;  
  username?: string;
  password?: string;
  topicPrefix: string;
}

export function useMqttLocations(
  initialLocations: Location[],
  config: MqttConfig
) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('MQTT Hook - Initializing with config:', {
      brokerUrl: config.brokerUrl,
      username: config.username,
      topicPrefix: config.topicPrefix,
    });

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

      // Single topic
      client.subscribe('bike/load', (err) => {
        if (err) {
          console.error('Subscribe error:', err);
        } else {
          console.log('Subscribed to bike/load');
        }
      });

      // Debug: Subscribe to all topics to see if ANY messages arrive
      client.subscribe('#', (err) => {
        if (err) {
          console.error('Debug subscribe error:', err);
        } else {
          console.log('Debug: Subscribed to # (all topics)');
        }
      });
    });

    client.on('message', (topic, message) => {
      console.log('🔔 DEBUG: Message received on ANY topic:', topic, 'Payload:', message.toString());
      
      if (topic !== 'bike/load') {
        return;
      }
      
      console.log('✅ Message on bike/load topic');

      try {
        const payload = JSON.parse(message.toString());
        const { location_id, occupied } = payload;

        console.log('Parsed payload:', { location_id, occupied });

        if (!location_id || typeof occupied !== 'boolean') {
          console.warn('Invalid payload format - location_id:', location_id, 'occupied type:', typeof occupied);
          return;
        }

        setLocations((prev) =>
          prev.map((loc) => {
            if (loc.id !== location_id) {
              return loc;
            }

            // When occupied is true, subtract 1 from spaces free (add 1 to occupied)
            // When occupied is false, add 1 to spaces free (subtract 1 from occupied)
            const newOccupied = occupied
              ? (loc.occupied || 0) + 1
              : Math.max(0, (loc.occupied || 0) - 1);

            return {
              ...loc,
              occupied: Math.max(0, Math.min(loc.capacity, newOccupied)),
            };
          })
        );

        console.log(`MQTT update for ${location_id}: occupied=${occupied}`);
      } catch (err) {
        console.error('MQTT message error:', err);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setConnected(false);
    });

    client.on('offline', () => {
      console.log('MQTT offline');
      setConnected(false);
    });

    client.on('reconnect', () => {
      console.log('MQTT reconnecting...');
    });

    return () => {
      client.end();
    };
  }, [config.brokerUrl, config.username, config.password, config.topicPrefix]);

  return { locations, connected };
}