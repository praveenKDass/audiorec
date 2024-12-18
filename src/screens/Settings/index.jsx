import React, { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableNativeFeedback, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const languages = [
  { name: 'english', code: 'en' },
  { name: 'hindi', code: 'hi' }
];

const Settings = () => {
  const [showLanguagesList, setOpenLanguagesList] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    console.log("lang",lang)
    i18n.changeLanguage(lang)
  };

  return (
    <View style={styles.container}>
      <TouchableNativeFeedback
        onPress={() => {
          setOpenLanguagesList(!showLanguagesList);
          LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
        }}
      >
        <View style={styles.button}>
          <Text style={styles.buttonText}>{t('changeLanguage')}</Text>
        </View>
      </TouchableNativeFeedback>
      {showLanguagesList && (
        <>
          {languages.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.button, { paddingHorizontal: 24 }]}
              onPress={() => changeLanguage(item.code)}
            >
              <Text style={styles.buttonText}>{t(item.name)}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  button: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginVertical: 5,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
});
