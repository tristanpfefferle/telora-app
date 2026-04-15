/**
 * Config plugin pour permettre le trafic HTTP vers le backend Telora
 * Crée network_security_config.xml automatiquement pendant EAS Build
 */

const { AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNetworkSecurityConfig = (config) => {
  config = AndroidConfig.NetworkSecurityConfig.withNetworkSecurityConfig(config, {
    cleartextTraffic: true,
    domains: ['187.124.218.190', 'localhost', '127.0.0.1'],
  });
  return config;
};

module.exports = withNetworkSecurityConfig;
