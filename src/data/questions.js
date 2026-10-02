// Questions ordonnées du plus accessible au plus technique.
// Le contenu reste volontairement limité aux notions présentes dans les supports du bootcamp.

export const quizQuestions = [
  {
    level: 'Niveau 1', category: 'Système',
    question: 'Quelle mémoire est volatile et sert principalement d’espace de travail aux programmes actifs ?',
    options: ['SSD', 'RAM', 'HDD', 'Carte réseau'], correct: 1,
    explanation: 'La RAM est la mémoire de travail principale et son contenu disparaît lorsque la machine est éteinte ou redémarrée.'
  },
  {
    level: 'Niveau 1', category: 'Réseau',
    question: 'Quel équipement connecte plusieurs machines dans un LAN et apprend les adresses MAC présentes sur ses ports ?',
    options: ['Switch', 'Routeur', 'Pare-feu', 'Serveur DNS'], correct: 0,
    explanation: 'Le switch apprend les adresses MAC et transmet les trames vers le port approprié.'
  },
  {
    level: 'Niveau 1', category: 'OSI',
    question: 'Dans le modèle OSI, quelle couche assure principalement l’adressage logique et le routage ?',
    options: ['Physique', 'Liaison de données', 'Réseau', 'Application'], correct: 2,
    explanation: 'La couche 3 Réseau gère l’adressage logique et le routage.'
  },
  {
    level: 'Niveau 2', category: 'TCP/IP',
    question: 'Quel protocole de transport est orienté connexion et assure notamment la retransmission des données perdues ?',
    options: ['ARP', 'TCP', 'ICMP', 'DHCP'], correct: 1,
    explanation: 'TCP est orienté connexion et fournit des mécanismes de fiabilité, de remise en ordre et de retransmission.'
  },
  {
    level: 'Niveau 2', category: 'IPv4',
    question: 'Combien d’adresses IPv4 contient au total un sous-réseau /27 ?',
    options: ['16', '30', '32', '64'], correct: 2,
    explanation: 'Un /27 laisse 5 bits disponibles : 2⁵ = 32 adresses au total.'
  },
  {
    level: 'Niveau 2', category: 'DNS',
    question: 'Quel port est classiquement associé au DNS ?',
    options: ['22', '53', '80', '443'], correct: 1,
    explanation: 'Le DNS classique utilise le port 53, principalement en UDP et aussi en TCP selon les cas.'
  },
  {
    level: 'Niveau 2', category: 'DHCP',
    question: 'Quel ordre correspond au processus DORA de DHCP en IPv4 ?',
    options: [
      'Discover → Offer → Request → Acknowledge',
      'Discover → Request → Offer → Acknowledge',
      'Offer → Discover → Acknowledge → Request',
      'Request → Offer → Discover → Acknowledge'
    ], correct: 0,
    explanation: 'DORA signifie Discover, Offer, Request, Acknowledge.'
  },
  {
    level: 'Niveau 2', category: 'Linux',
    question: 'Quelle commande affiche le répertoire courant ?',
    options: ['pwd', 'mkdir', 'grep', 'kill'], correct: 0,
    explanation: 'pwd affiche le chemin du répertoire courant.'
  },
  {
    level: 'Niveau 3', category: 'Linux permissions',
    question: 'Que signifie chmod 640 rapport.txt ?',
    options: [
      'Propriétaire rw-, groupe r--, autres ---',
      'Propriétaire rwx, groupe r-x, autres ---',
      'Tous les utilisateurs ont rwx',
      'Le fichier devient exécutable pour tous'
    ], correct: 0,
    explanation: '6 = rw-, 4 = r-- et 0 = ---.'
  },
  {
    level: 'Niveau 3', category: 'Linux processus',
    question: 'Quel identifiant unique est associé à un processus Linux ?',
    options: ['UID', 'PID', 'GID', 'CIDR'], correct: 1,
    explanation: 'Chaque processus possède un PID : Process ID.'
  },
  {
    level: 'Niveau 3', category: 'Python',
    question: 'Quel type retourne input() avant toute conversion explicite ?',
    options: ['int', 'float', 'str', 'bool'], correct: 2,
    explanation: 'input() retourne une chaîne de caractères ; on utilise souvent int() ou float() ensuite.'
  },
  {
    level: 'Niveau 3', category: 'Python système',
    question: 'Quelle fonction du module os renvoie le dossier courant ?',
    options: ['os.getcwd()', 'os.remove()', 'os.environ.get()', 'os.path.isfile()'], correct: 0,
    explanation: 'os.getcwd() renvoie le dossier courant.'
  }
]

export const championQuestions = [
  {
    level: 'Niveau 1', category: 'Système', answer: 'RAM', accepted: ['ram', 'mémoire ram', 'memoire ram'],
    clues: [
      'Je suis utilisée par les programmes actifs.',
      'Je suis une mémoire de travail rapide.',
      'Je ne suis pas destinée à conserver durablement les fichiers.',
      'Je suis volatile : mon contenu disparaît lorsque la machine est éteinte ou redémarrée.'
    ],
    explanation: 'La RAM est la mémoire de travail principale et son contenu est volatile.'
  },
  {
    level: 'Niveau 1', category: 'Réseau', answer: 'switch', accepted: ['switch', 'commutateur', 'commutateur réseau'],
    clues: [
      'Je relie plusieurs équipements dans un réseau local.',
      'Je travaille principalement avec des trames.',
      'J’apprends les adresses MAC présentes sur mes ports.',
      'Je transmets une trame vers le port approprié grâce à ma table MAC.'
    ],
    explanation: 'Le switch connecte les équipements d’un LAN et apprend les adresses MAC afin d’orienter les trames.'
  },
  {
    level: 'Niveau 1', category: 'Réseau', answer: 'routeur', accepted: ['routeur', 'router'],
    clues: [
      'Je relie des réseaux différents.',
      'Je m’intéresse à l’adresse IP de destination.',
      'Je consulte une table pour décider où envoyer les paquets.',
      'Je peux servir de passerelle entre un LAN et Internet.'
    ],
    explanation: 'Le routeur relie plusieurs réseaux et utilise une table de routage pour acheminer les paquets.'
  },
  {
    level: 'Niveau 2', category: 'Services réseau', answer: 'DNS', accepted: ['dns', 'domain name system'],
    clues: [
      'Je permets d’éviter de mémoriser uniquement des adresses IP.',
      'Je manipule notamment des enregistrements A, AAAA, CNAME et MX.',
      'Les requêtes classiques utilisent souvent le port 53.',
      'Je transforme un nom de domaine en informations réseau, notamment une adresse IP.'
    ],
    explanation: 'DNS associe les noms de domaine à des informations réseau comme des adresses IPv4 ou IPv6.'
  },
  {
    level: 'Niveau 2', category: 'Services réseau', answer: 'DHCP', accepted: ['dhcp', 'dynamic host configuration protocol'],
    clues: [
      'Je simplifie la configuration des postes clients.',
      'Je peux fournir une adresse IP, un masque, une passerelle et des DNS.',
      'Mon échange IPv4 classique se mémorise avec DORA.',
      'Discover, Offer, Request, Acknowledge décrivent mon fonctionnement.'
    ],
    explanation: 'DHCP fournit automatiquement des paramètres réseau aux clients IPv4.'
  },
  {
    level: 'Niveau 2', category: 'Diagnostic réseau', answer: 'ping', accepted: ['ping'],
    clues: [
      'Je suis souvent utilisé au début d’un diagnostic.',
      'Je peux vérifier si une destination répond au niveau IP.',
      'Je m’appuie sur ICMP Echo Request et Echo Reply.',
      'Ma commande porte un nom très court de quatre lettres.'
    ],
    explanation: 'ping utilise ICMP pour tester la joignabilité d’un hôte.'
  },
  {
    level: 'Niveau 2', category: 'Réseau local', answer: 'ARP', accepted: ['arp', 'address resolution protocol'],
    clues: [
      'Je suis utile sur un réseau local IPv4.',
      'Je fais le lien entre l’adressage logique et la livraison locale.',
      'Une machine m’utilise lorsqu’elle connaît l’IPv4 mais pas encore l’adresse physique.',
      'Je retrouve une adresse MAC associée à une adresse IPv4.'
    ],
    explanation: 'ARP permet, en IPv4 sur un LAN, de retrouver la MAC correspondant à une adresse IPv4.'
  },
  {
    level: 'Niveau 2', category: 'Linux', answer: 'shell', accepted: ['shell', 'bash', 'interpréteur de commandes', 'interpreteur de commandes'],
    clues: [
      'Je ne suis pas le terminal lui-même.',
      'Je reçois les commandes saisies par l’utilisateur.',
      'Je demande ensuite au système de les exécuter.',
      'Bash, Zsh, Fish et sh sont des exemples de ma famille.'
    ],
    explanation: 'Le shell interprète les commandes. Bash est l’un des shells les plus répandus sous Linux.'
  },
  {
    level: 'Niveau 3', category: 'Linux', answer: 'processus', accepted: ['processus', 'process'],
    clues: [
      'Je suis lié à un programme, mais je ne suis pas seulement un fichier sur disque.',
      'Le système me donne généralement un identifiant.',
      'ps, top ou htop permettent de m’observer.',
      'Je suis une instance d’un programme actuellement en cours d’exécution.'
    ],
    explanation: 'Un processus est une instance d’un programme en cours d’exécution et possède notamment un PID.'
  },
  {
    level: 'Niveau 3', category: 'Linux permissions', answer: 'chmod', accepted: ['chmod'],
    clues: [
      'Je modifie une propriété de sécurité des fichiers et dossiers.',
      'Je peux utiliser une notation symbolique ou numérique.',
      'Dans la notation numérique, r vaut 4, w vaut 2 et x vaut 1.',
      'Une commande comme chmod 640 rapport.txt utilise mon nom.'
    ],
    explanation: 'chmod modifie les permissions classiques Linux.'
  },
  {
    level: 'Niveau 3', category: 'Python système', answer: 'os', accepted: ['os', 'module os', 'le module os'],
    clues: [
      'Je fais partie de la bibliothèque standard Python.',
      'Je peux donner le dossier courant et lister un répertoire.',
      'Je peux créer des dossiers, tester un chemin et lire une variable d’environnement.',
      'On m’importe souvent avec : import os.'
    ],
    explanation: 'Le module os permet d’interagir avec le système d’exploitation et les chemins depuis Python.'
  },
  {
    level: 'Niveau 3', category: 'Python système', answer: 'os.path.exists', accepted: ['os.path.exists', 'exists', 'os path exists'],
    clues: [
      'Je renvoie une valeur logique.',
      'Je suis utilisée avant certaines opérations sur des chemins.',
      'J’aide à ne pas supposer qu’un fichier ou dossier est présent.',
      'Dans os.path, je teste si un chemin existe.'
    ],
    explanation: 'os.path.exists(...) permet de vérifier l’existence d’un chemin.'
  }
]

export const bashChallenges = [
  {
    level: 'Pratique 1', category: 'Bash · fichiers', title: 'Construire l’arborescence du bootcamp', points: 40, time: 240,
    prompt: 'En Bash, créer bootcamp/linux avec les sous-dossiers cours, tp et sauvegarde. Créer ensuite cours/linux.txt et tp/exercice.txt puis afficher l’arborescence obtenue.',
    constraints: ['Créer plusieurs dossiers', 'Créer les deux fichiers', 'Afficher ou vérifier le résultat'],
    expected: ['mkdir -p', 'touch', 'find . ou commande équivalente vue en cours'],
    note: 'Le but est de vérifier la maîtrise du shell, des chemins et de l’arborescence.'
  },
  {
    level: 'Pratique 2', category: 'Bash · permissions', title: 'Dossier partagé /projet', points: 60, time: 360,
    prompt: 'Créer les utilisateurs alice, bob et charles, le groupe dev, ajouter alice et bob au groupe dev, puis préparer /projet appartenant à alice:dev. Le propriétaire et le groupe doivent avoir rwx, les autres aucun accès.',
    constraints: ['Créer utilisateurs et groupe', 'Ajouter alice et bob à dev', 'Créer /projet', 'Définir propriétaire/groupe', 'Permissions 770'],
    expected: ['useradd -m', 'groupadd', 'usermod -aG', 'mkdir', 'chown', 'chmod 770'],
    note: 'L’animateur attribue les points selon les étapes correctement réalisées.'
  },
  {
    level: 'Pratique 3', category: 'Bash · services', title: 'Diagnostiquer un service en échec', points: 60, time: 300,
    prompt: 'Un service nginx est en erreur. Montrer une séquence de commandes cohérente pour vérifier son état, consulter ses journaux, tester sa configuration puis le recharger ou le redémarrer.',
    constraints: ['État du service', 'Logs', 'Test de configuration', 'Reload ou restart après correction'],
    expected: ['systemctl status nginx', 'journalctl -u nginx', 'nginx -t', 'systemctl reload nginx ou systemctl restart nginx'],
    note: 'L’ordre logique compte autant que la mémorisation des commandes.'
  }
]

export const pythonChallenges = [
  {
    level: 'Pratique 1', category: 'Python système', title: 'Inventaire du dossier courant', points: 40, time: 240,
    prompt: 'Écrire un script Python qui affiche le dossier courant puis liste tous les éléments qu’il contient.',
    constraints: ['Utiliser le module os', 'Afficher le chemin courant', 'Afficher le contenu du dossier'],
    expected: ['import os', 'os.getcwd()', 'os.listdir()'],
    note: 'Le barème est manuel : tous les points si le script fonctionne, ou une partie des points selon l’avancement.'
  },
  {
    level: 'Pratique 2', category: 'Python système', title: 'Créer un espace de logs sans erreur', points: 50, time: 300,
    prompt: 'Écrire un script qui vérifie si un dossier logs existe. S’il n’existe pas, le créer. Ensuite créer logs/rapport.txt et y écrire une ligne de texte.',
    constraints: ['Tester l’existence du dossier', 'Créer le dossier si nécessaire', 'Construire le chemin proprement', 'Écrire dans un fichier texte'],
    expected: ['os.path.exists()', 'os.makedirs() ou os.mkdir()', 'os.path.join()', 'with open(..., "w", encoding="utf-8")'],
    note: 'Accepter une solution équivalente utilisant les notions vues dans le cours.'
  },
  {
    level: 'Pratique 3', category: 'Python système', title: 'Séparer fichiers et dossiers', points: 50, time: 300,
    prompt: 'Dans le dossier courant, afficher séparément les fichiers et les dossiers.',
    constraints: ['Lister le contenu', 'Construire le chemin complet', 'Tester si chaque élément est un fichier ou un dossier'],
    expected: ['os.listdir()', 'os.path.join()', 'os.path.isfile()', 'os.path.isdir()'],
    note: 'La présentation exacte de la sortie est libre.'
  }
]

export const finalQuizQuestions = [
  {
    level: 'Finale', category: 'Diagnostic réseau',
    question: 'Un poste atteint une adresse IP distante avec ping, mais un nom de domaine ne fonctionne pas. Quelle vérification devient prioritaire ?',
    options: ['La résolution DNS', 'La quantité de RAM', 'Les permissions chmod', 'Le modèle du CPU'], correct: 0,
    explanation: 'La connectivité IP semble présente ; le problème peut être limité à la résolution de noms.'
  },
  {
    level: 'Finale', category: 'Diagnostic réseau',
    question: 'Quel ordre suit le mieux un diagnostic réseau par couches ?',
    options: [
      'Application → Physique → Réseau',
      'Physique → Liaison → Réseau → Transport → Application',
      'Transport → CPU → DNS → Stockage',
      'DNS → DHCP → RAM → Routeur'
    ], correct: 1,
    explanation: 'Le cours propose de progresser du physique vers l’application pour isoler la couche en panne.'
  },
  {
    level: 'Finale', category: 'Linux services',
    question: 'Quelle commande est la plus adaptée pour vérifier l’état actuel du service nginx ?',
    options: ['systemctl status nginx', 'chmod nginx', 'pwd nginx', 'ip route nginx'], correct: 0,
    explanation: 'systemctl status affiche l’état d’un service géré par systemd.'
  },
  {
    level: 'Finale', category: 'Linux services',
    question: 'Après modification d’une unité systemd, quelle action demande à systemd de relire sa configuration ?',
    options: ['systemctl daemon-reload', 'ping', 'chmod 777', 'pwd'], correct: 0,
    explanation: 'systemctl daemon-reload demande à systemd de relire sa configuration après création ou modification d’unités.'
  },
  {
    level: 'Finale', category: 'Python système',
    question: 'Vous devez créer un dossier seulement s’il n’existe pas. Quelle combinaison est la plus directement liée au cours ?',
    options: ['os.path.exists() puis os.makedirs()', 'print() puis len()', 'int() puis float()', 'tuple() puis set()'], correct: 0,
    explanation: 'os.path.exists() teste l’existence et os.makedirs() peut créer un ou plusieurs dossiers.'
  },
  {
    level: 'Finale', category: 'Python fichiers',
    question: 'Pourquoi la forme with open(...) as f est-elle recommandée ?',
    options: ['Elle referme automatiquement le fichier', 'Elle transforme toujours le fichier en JSON', 'Elle exécute le fichier avec Bash', 'Elle change les permissions Linux'], correct: 0,
    explanation: 'Le contexte with referme automatiquement le fichier et réduit les erreurs de manipulation.'
  }
]

export const finalChampionQuestions = [
  {
    level: 'Finale', category: 'Réseau', answer: 'NAT', accepted: ['nat', 'network address translation'],
    clues: [
      'Je suis couramment utilisé en IPv4 sur les routeurs.',
      'Je participe au passage entre réseau privé et réseau public.',
      'Je peux faire correspondre plusieurs adresses internes à une ou plusieurs adresses publiques.',
      'Mon nom signifie Network Address Translation.'
    ], explanation: 'Le NAT fait correspondre des adresses privées et publiques en IPv4.'
  },
  {
    level: 'Finale', category: 'Linux services', answer: 'systemctl', accepted: ['systemctl'],
    clues: [
      'Je suis utilisé sur de nombreuses distributions Linux modernes.',
      'Je travaille avec systemd.',
      'Mes actions comprennent start, stop, restart, enable et status.',
      'Je suis la commande principale de gestion des services systemd.'
    ], explanation: 'systemctl permet notamment de démarrer, arrêter, redémarrer, activer et consulter l’état des services.'
  },
  {
    level: 'Finale', category: 'Python système', answer: 'os.path.join', accepted: ['os.path.join', 'path join', 'os path join'],
    clues: [
      'Je fais partie des outils de gestion de chemins vus en Python.',
      'J’évite de concaténer les morceaux d’un chemin à la main.',
      'On me trouve sous os.path.',
      'Je construis proprement un chemin à partir de plusieurs parties.'
    ], explanation: 'os.path.join(...) construit un chemin à partir de plusieurs composants.'
  },
  {
    level: 'Finale', category: 'Réseau', answer: 'passerelle par défaut', accepted: ['passerelle', 'passerelle par défaut', 'default gateway', 'gateway'],
    clues: [
      'Je suis utilisée lorsque la destination n’est pas dans le sous-réseau local.',
      'Je suis normalement une adresse IP connue du poste.',
      'Je désigne un routeur à utiliser pour atteindre d’autres réseaux.',
      'Sans moi, un poste peut communiquer localement mais ne sait pas où envoyer un paquet destiné à un réseau distant.'
    ], explanation: 'La passerelle par défaut est le routeur utilisé pour joindre une destination hors du sous-réseau local.'
  }
]

export const finalBashChallenges = [
  {
    level: 'Finale', category: 'Bash · processus', title: 'Processus à identifier puis arrêter proprement', points: 70, time: 300,
    prompt: 'Montrer comment rechercher un processus par nom, récupérer son PID puis lui demander un arrêt propre. Expliquer ce que vous feriez si l’arrêt propre échoue.',
    constraints: ['Recherche du processus', 'Récupération du PID', 'SIGTERM en priorité', 'SIGKILL seulement en dernier recours'],
    expected: ['pgrep ou pidof ou ps | grep', 'kill PID ou kill -15 PID', 'kill -9 seulement en dernier recours'],
    note: 'La justification sur SIGTERM et SIGKILL fait partie du barème.'
  },
  {
    level: 'Finale', category: 'Bash · réseau', title: 'Diagnostic réseau par couches', points: 80, time: 360,
    prompt: 'Un serveur Linux « n’a plus Internet ». Construire une séquence de diagnostic qui vérifie interface, adresse IP, route, passerelle, DNS puis accès applicatif.',
    constraints: ['Commencer par les éléments locaux', 'Vérifier IP et route', 'Tester la passerelle', 'Tester DNS', 'Tester un service applicatif'],
    expected: ['ip link', 'ip addr', 'ip route', 'ping', 'dig ou nslookup', 'curl ou ssh selon le scénario'],
    note: 'L’objectif est d’isoler la couche en panne plutôt que de lancer des commandes au hasard.'
  }
]

export const finalPythonChallenges = [
  {
    level: 'Finale', category: 'Python système', title: 'Mini audit d’un dossier', points: 70, time: 360,
    prompt: 'Écrire un script qui parcourt le dossier courant, compte le nombre de fichiers et de dossiers, puis affiche un résumé clair.',
    constraints: ['Utiliser os.listdir()', 'Utiliser os.path.join()', 'Distinguer fichier et dossier', 'Afficher les compteurs'],
    expected: ['os.listdir()', 'os.path.join()', 'os.path.isfile()', 'os.path.isdir()', 'compteurs avec variables'],
    note: 'Le code doit être lisible et produire un résultat vérifiable.'
  },
  {
    level: 'Finale', category: 'Python système', title: 'Rapport système simple', points: 70, time: 360,
    prompt: 'Créer un fichier rapport_systeme.txt contenant le dossier courant, la liste de son contenu et la valeur d’une variable d’environnement de votre choix.',
    constraints: ['Lire le dossier courant', 'Lister son contenu', 'Lire une variable d’environnement', 'Écrire un fichier'],
    expected: ['os.getcwd()', 'os.listdir()', 'os.environ.get()', 'with open(...)'],
    note: 'Le choix de la variable d’environnement est libre.'
  }
]
