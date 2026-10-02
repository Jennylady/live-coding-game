export const championQuestions = [
  {
    category: 'OSI',
    answer: 'switch',
    accepted: ['switch', 'commutateur', 'commutateur réseau'],
    clues: [
      'Je travaille principalement dans un réseau local.',
      'J’apprends les adresses de mes voisins pour décider où envoyer les trames.',
      'Ma table principale contient des adresses MAC associées à des ports.',
      'Je fonctionne principalement à la couche 2 du modèle OSI.'
    ],
    explanation: 'Un switch Ethernet apprend les adresses MAC sources et utilise sa table MAC/CAM pour transférer les trames vers le bon port.'
  },
  {
    category: 'Adressage',
    answer: 'ARP',
    accepted: ['arp', 'address resolution protocol'],
    clues: [
      'Je suis utilisé lorsqu’une machine connaît une adresse logique mais pas encore l’adresse physique correspondante.',
      'Je travaille surtout à l’intérieur du réseau local.',
      'Ma requête est généralement diffusée en broadcast.',
      'Je permets d’associer une adresse IPv4 à une adresse MAC.'
    ],
    explanation: 'ARP résout une adresse IPv4 en adresse MAC sur le réseau local.'
  },
  {
    category: 'Services',
    answer: 'DHCP',
    accepted: ['dhcp', 'dynamic host configuration protocol'],
    clues: [
      'Je réduis la configuration manuelle des postes clients.',
      'Je peux fournir une passerelle par défaut et des serveurs DNS.',
      'Mon échange classique commence par Discover puis Offer.',
      'J’attribue automatiquement des paramètres IP aux clients.'
    ],
    explanation: 'DHCP automatise l’attribution d’adresse IP, masque, passerelle, DNS et autres options.'
  },
  {
    category: 'Services',
    answer: 'DNS',
    accepted: ['dns', 'domain name system'],
    clues: [
      'Sans moi, les utilisateurs devraient souvent retenir des adresses IP.',
      'Je fonctionne avec une hiérarchie distribuée.',
      'Je manipule notamment des enregistrements A, AAAA, CNAME et MX.',
      'Je traduis des noms comme serveur.exemple.local en adresses IP.'
    ],
    explanation: 'DNS permet notamment la résolution de noms vers des adresses IP.'
  },
  {
    category: 'VLAN',
    answer: 'trunk',
    accepted: ['trunk', 'lien trunk', 'port trunk'],
    clues: [
      'Je suis particulièrement utile entre deux équipements réseau.',
      'Je peux transporter plusieurs réseaux logiques sur un seul lien physique.',
      'Avec Ethernet, on me rencontre souvent avec IEEE 802.1Q.',
      'Je transporte plusieurs VLAN entre des switches ou vers un routeur.'
    ],
    explanation: 'Un lien trunk 802.1Q transporte les trames de plusieurs VLAN en ajoutant un tag VLAN, sauf cas particuliers comme le VLAN natif.'
  },
  {
    category: 'Routage',
    answer: 'routeur',
    accepted: ['routeur', 'router'],
    clues: [
      'Je prends des décisions à partir d’un réseau de destination.',
      'Je peux relier plusieurs réseaux IP différents.',
      'Je consulte une table contenant des routes connectées, statiques ou apprises.',
      'Je suis l’équipement emblématique de la couche 3.'
    ],
    explanation: 'Le routeur sélectionne une route vers le réseau de destination à partir de sa table de routage.'
  },
  {
    category: 'Transport',
    answer: 'TCP',
    accepted: ['tcp', 'transmission control protocol'],
    clues: [
      'Je suis un protocole de transport.',
      'Je mets en place une connexion avant l’échange principal de données.',
      'Je numérote, acquitte et retransmets les données si nécessaire.',
      'Mon établissement de connexion utilise SYN, SYN-ACK puis ACK.'
    ],
    explanation: 'TCP est orienté connexion et fournit fiabilité, ordre et contrôle de flux.'
  },
  {
    category: 'Diagnostic',
    answer: 'ping',
    accepted: ['ping'],
    clues: [
      'Je suis souvent l’un des premiers outils utilisés lors d’un dépannage réseau.',
      'Je peux donner une indication sur le temps aller-retour.',
      'Je m’appuie généralement sur ICMP Echo Request et Echo Reply.',
      'On m’utilise pour vérifier rapidement si un hôte répond sur le réseau.'
    ],
    explanation: 'ping utilise ICMP Echo pour tester la joignabilité IP et mesurer approximativement le RTT.'
  },
  {
    category: 'Diagnostic',
    answer: 'traceroute',
    accepted: ['traceroute', 'tracert'],
    clues: [
      'Je suis utile lorsque la destination est lointaine.',
      'Je révèle progressivement les équipements intermédiaires qui répondent.',
      'Mon fonctionnement exploite la diminution du TTL ou Hop Limit.',
      'Je montre le chemin suivi, ou au moins les sauts visibles, vers une destination.'
    ],
    explanation: 'traceroute/tracert fait varier le TTL pour révéler les sauts intermédiaires qui répondent.'
  },
  {
    category: 'Sécurité',
    answer: 'pare-feu',
    accepted: ['pare-feu', 'pare feu', 'firewall'],
    clues: [
      'Je peux être placé entre deux zones de confiance différentes.',
      'Je prends des décisions à partir de règles.',
      'Je peux filtrer selon des adresses, ports, protocoles ou états de connexion.',
      'Mon rôle principal est de contrôler les flux réseau autorisés ou bloqués.'
    ],
    explanation: 'Un pare-feu applique une politique de filtrage du trafic entre zones ou hôtes.'
  },
  {
    category: 'IPv4',
    answer: 'passerelle par défaut',
    accepted: ['passerelle par défaut', 'passerelle', 'default gateway', 'gateway'],
    clues: [
      'Je suis configurée sur les hôtes.',
      'Je ne suis pas nécessaire pour joindre un hôte du même sous-réseau.',
      'Je dois être joignable localement par le poste qui m’utilise.',
      'Je reçois les paquets destinés à des réseaux inconnus du poste local.'
    ],
    explanation: 'La passerelle par défaut reçoit le trafic destiné à des réseaux non directement connectés à l’hôte.'
  },
  {
    category: 'Linux',
    answer: 'ip addr',
    accepted: ['ip addr', 'ip a', 'ip address'],
    clues: [
      'Je suis une commande Linux moderne liée à iproute2.',
      'Je peux afficher plusieurs interfaces réseau.',
      'Je montre notamment les adresses IPv4 et IPv6 configurées.',
      'On m’écrit souvent sous forme courte : ip a.'
    ],
    explanation: 'ip addr, souvent abrégé ip a, affiche les interfaces et leurs adresses IP sous Linux.'
  }
]

export const sprintQuestions = [
  {
    category: 'OSI',
    question: 'À quelle couche du modèle OSI appartient principalement IP ?',
    options: ['Couche 2 — Liaison', 'Couche 3 — Réseau', 'Couche 4 — Transport', 'Couche 7 — Application'],
    correct: 1,
    explanation: 'IP fournit l’adressage logique et le routage inter-réseaux : couche 3.'
  },
  {
    category: 'IPv4',
    question: 'Combien d’adresses IPv4 contient un sous-réseau /27 ?',
    options: ['16', '30', '32', '64'],
    correct: 2,
    explanation: 'Un /27 laisse 5 bits pour les hôtes : 2⁵ = 32 adresses au total, généralement 30 utilisables en adressage classique.'
  },
  {
    category: 'Cisco',
    question: 'Quelle commande Cisco IOS affiche directement la table de routage IPv4 ?',
    options: ['show vlan brief', 'show ip route', 'show mac address-table', 'show interfaces trunk'],
    correct: 1,
    explanation: 'show ip route affiche les routes IPv4 connues du routeur ou du switch L3.'
  },
  {
    category: 'VLAN',
    question: 'Un PC du VLAN 10 doit communiquer avec un PC du VLAN 20. Que faut-il au minimum ?',
    options: ['Un hub', 'Du routage inter-VLAN', 'ARP désactivé', 'Un câble croisé uniquement'],
    correct: 1,
    explanation: 'Deux VLAN distincts sont deux domaines IP/logiques séparés ; un équipement L3 doit assurer le routage entre eux.'
  },
  {
    category: 'Services',
    question: 'Quel port UDP est traditionnellement utilisé par les requêtes DNS classiques côté serveur ?',
    options: ['22', '53', '67', '443'],
    correct: 1,
    explanation: 'DNS utilise classiquement le port 53, en UDP pour beaucoup de requêtes et aussi TCP dans plusieurs cas.'
  },
  {
    category: 'Diagnostic',
    question: 'Un poste a 192.168.10.25/24. Quelle adresse est dans le même sous-réseau ?',
    options: ['192.168.10.200', '192.168.11.25', '10.168.10.25', '172.16.10.25'],
    correct: 0,
    explanation: 'Avec /24, les 24 premiers bits doivent être identiques : 192.168.10.0/24.'
  },
  {
    category: 'TCP/IP',
    question: 'Quel événement termine normalement le three-way handshake TCP ?',
    options: ['RST', 'ACK du client', 'FIN du serveur', 'ICMP Reply'],
    correct: 1,
    explanation: 'Après SYN puis SYN-ACK, le client envoie ACK pour terminer l’établissement de la connexion.'
  },
  {
    category: 'GNS3',
    question: 'Dans un TP GNS3, deux machines du même LAN ne se joignent pas. Quelle vérification est la plus logique en premier ?',
    options: ['Changer immédiatement le protocole de routage', 'Vérifier IP, masque, état du lien et VLAN', 'Installer un serveur DNS public', 'Augmenter le TTL à 255'],
    correct: 1,
    explanation: 'Un dépannage efficace commence par les éléments locaux les plus fondamentaux : lien, configuration IP et appartenance VLAN.'
  }
]

export const finalQuestions = [
  {
    category: 'Subnetting',
    question: 'Vous devez créer au moins 6 sous-réseaux à partir de 192.168.1.0/24 avec un masque identique. Quel préfixe minimal convient ?',
    options: ['/25', '/26', '/27', '/30'],
    correct: 2,
    explanation: 'Il faut emprunter au moins 3 bits : 2³ = 8 sous-réseaux. /24 + 3 = /27.'
  },
  {
    category: 'Analyse',
    question: 'PC-A = 10.0.1.10/24, passerelle 10.0.1.1. PC-B = 10.0.2.20/24, passerelle 10.0.2.1. Les deux passerelles sont sur le même routeur. Quel mécanisme permet leur communication ?',
    options: ['Le switch L2 apprend les deux IP', 'Le routeur transfère entre les deux réseaux', 'DNS convertit les adresses IP', 'DHCP relaie les paquets'],
    correct: 1,
    explanation: 'Les hôtes sont dans 10.0.1.0/24 et 10.0.2.0/24 ; le routeur assure le transfert inter-réseaux.'
  },
  {
    category: 'Dépannage',
    question: 'Un PC peut ping 8.8.8.8 mais pas ouvrir intranet.local. Quel service faut-il suspecter en priorité ?',
    options: ['DNS', 'ARP uniquement', 'STP', 'NAT statique obligatoire'],
    correct: 0,
    explanation: 'La connectivité IP externe fonctionne ; l’échec sur un nom oriente d’abord vers la résolution DNS.'
  },
  {
    category: 'Switching',
    question: 'Sur un switch, un port access configuré en VLAN 30 reçoit une trame Ethernet non taguée d’un PC. À quel VLAN la trame est-elle associée ?',
    options: ['VLAN 1 automatiquement', 'VLAN 30', 'À tous les VLAN du switch', 'À aucun VLAN'],
    correct: 1,
    explanation: 'Une trame non taguée reçue sur un port access est associée au VLAN d’accès configuré sur ce port.'
  }
]
