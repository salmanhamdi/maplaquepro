// Modèles d'emails de compte (texte brut). Les liens portent un jeton à usage unique ; le jeton
// n'apparaît que dans le corps de l'email, jamais dans un journal.
import type { MessageEmail } from "./envoi";

export function emailVerification(a: string, lien: string): MessageEmail {
  return {
    a,
    sujet: "Confirmez votre adresse email — MaPlaquePro",
    texte: `Bonjour,\n\nPour confirmer l'adresse de votre compte MaPlaquePro, ouvrez ce lien :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
  };
}

export function emailCompteExistant(a: string, lienConnexion: string, lienReinitialisation: string): MessageEmail {
  return {
    a,
    sujet: "Vous avez déjà un compte — MaPlaquePro",
    texte: `Bonjour,\n\nUne création de compte a été demandée avec cette adresse, qui possède déjà un compte.\nSe connecter : ${lienConnexion}\nMot de passe oublié : ${lienReinitialisation}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
  };
}

export function emailReinitialisation(a: string, lien: string): MessageEmail {
  return {
    a,
    sujet: "Réinitialisation de votre mot de passe — MaPlaquePro",
    texte: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.`,
  };
}

export function emailMotDePasseChange(a: string): MessageEmail {
  return {
    a,
    sujet: "Votre mot de passe a été modifié — MaPlaquePro",
    texte: "Bonjour,\n\nLe mot de passe de votre compte MaPlaquePro vient d'être modifié.\nSi vous n'êtes pas à l'origine de ce changement, réinitialisez votre mot de passe sans attendre.",
  };
}
