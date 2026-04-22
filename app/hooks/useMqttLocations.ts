"use client";

import { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import type { Location } from '@/data/locations';

interface MqttConfig {
  brokerUrl: string;  // Change from literal type to generic string
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
    });

    client.on('message', (topic, message) => {
      if (topic !== 'bike/load') return;

      try {
        let value: number;

        // Support BOTH raw numbers and JSON
        try {
          const parsed = JSON.parse(message.toString());
          value = parsed.value;
        } catch {
          value = parseFloat(message.toString());
        }

        if (isNaN(value)) {
          console.warn('Invalid value:', message.toString());
          return;
        }

        setLocations((prev) =>
          prev.map((loc, i) =>
            i === 0
              ? {
                  ...loc,
                  occupied: Math.max(0, Math.min(loc.capacity, value)),
                }
              : loc
          )
        );

        console.log('MQTT update:', value);
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
  }, [config.brokerUrl, config.username, config.password]);

  return { locations, connected };
}