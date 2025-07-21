import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function MentionLegal() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mentions légales & RGPD</Text>

      <Text style={styles.sectionTitle}>Éditeur du site</Text>
      <Text style={styles.paragraph}>
        Quentin & Ennio dev. corp.
      </Text>
      <Text style={styles.infoText}>📍 34 Av. de l'Europe Bâtiment D, 38100 Grenoble</Text>
      <Text style={styles.infoText}>📞 [Numéro de téléphone]</Text>
      <Text style={styles.infoText}>✉️ [Adresse email]</Text>

      <Text style={styles.sectionTitle}>Hébergement</Text>
      <Text style={styles.paragraph}>
        Hébergeur : [Nom de l’hébergeur]
      </Text>
      <Text style={styles.infoText}>📍 [Adresse complète de l’hébergeur]</Text>
      <Text style={styles.infoText}>📞 [Numéro de téléphone de l’hébergeur]</Text>

      <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
      <Text style={styles.paragraph}>
        Tous les contenus (textes, images, logos, vidéos...) sont la propriété exclusive de Quentin & Ennio dev. corp., sauf mention contraire.
      </Text>

      <Text style={styles.sectionTitle}>Collecte et traitement des données personnelles</Text>
      <Text style={styles.paragraph}>
        Nous collectons uniquement les données nécessaires au bon fonctionnement du service (nom, prénom, email, etc.). Ces données sont protégées et utilisées uniquement dans le cadre de cette application.
      </Text>

      <Text style={styles.sectionTitle}>Droits des utilisateurs</Text>
      <Text style={styles.paragraph}>
        Vous pouvez accéder, modifier, supprimer vos données ou vous opposer à leur traitement en nous contactant à : [adresse email de contact].
      </Text>

      <Text style={styles.sectionTitle}>Durée de conservation</Text>
      <Text style={styles.paragraph}>
        Les données sont conservées uniquement le temps nécessaire à leur utilisation légale ou contractuelle.
      </Text>

      <Text style={styles.sectionTitle}>Cookies</Text>
      <Text style={styles.paragraph}>
        Cette application n’utilise pas ou très peu de cookies strictement nécessaires. Vous pouvez gérer vos préférences via votre navigateur.
      </Text>

      <Text style={styles.sectionTitle}>Sécurité</Text>
      <Text style={styles.paragraph}>
        Nous appliquons des mesures techniques et organisationnelles pour sécuriser vos données contre tout accès non autorisé.
      </Text>

      <Text style={styles.sectionTitle}>Contact</Text>
      <Text style={styles.paragraph}>
        Pour toute question, contactez-nous à : [adresse email de contact].
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    color: '#2e86de',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 12,
    fontFamily: 'Arial',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
    fontStyle: 'italic',
  },
});
