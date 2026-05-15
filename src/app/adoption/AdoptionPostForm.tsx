'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

const ANIMAL_TYPES = [
  { id: 'chien',   label: 'Chien'   },
  { id: 'chat',    label: 'Chat'    },
  { id: 'oiseau',  label: 'Oiseau'  },
  { id: 'rongeur', label: 'Rongeur' },
  { id: 'reptile', label: 'Reptile' },
  { id: 'autre',   label: 'Autre'   },
];

const COUNTRIES = [
  'Belgique', 'France', 'Suisse', 'Luxembourg', 'Monaco',
  'Canada (Québec)', 'Haïti',
  'Guadeloupe', 'Martinique', 'La Réunion', 'Guyane française', 'Mayotte',
  'Nouvelle-Calédonie', 'Polynésie française',
  'Algérie', 'Maroc', 'Tunisie',
  'Bénin', 'Burkina Faso', 'Burundi', 'Cameroun', 'Comores',
  "Côte d'Ivoire", 'Djibouti', 'Gabon', 'Guinée', 'Guinée Équatoriale',
  'Madagascar', 'Mali', 'Maurice', 'Niger', 'République Centrafricaine',
  'République Démocratique du Congo', 'République du Congo', 'Rwanda',
  'Sénégal', 'Seychelles', 'Tchad', 'Togo', 'Vanuatu',
];

// Flag emoji + dial code — sorted with BE first, then alphabetically
const PHONE_CODES = [
  { flag: '🇧🇪', code: '+32',  name: 'Belgique'                  },
  { flag: '🇫🇷', code: '+33',  name: 'France'                    },
  { flag: '🇨🇭', code: '+41',  name: 'Suisse'                    },
  { flag: '🇱🇺', code: '+352', name: 'Luxembourg'                },
  { flag: '🇲🇨', code: '+377', name: 'Monaco'                    },
  { flag: '🇨🇦', code: '+1',   name: 'Canada'                    },
  { flag: '─', code: '─', name: '──────────────────'            }, // séparateur
  { flag: '🇦🇫', code: '+93',  name: 'Afghanistan'               },
  { flag: '🇿🇦', code: '+27',  name: 'Afrique du Sud'            },
  { flag: '🇦🇱', code: '+355', name: 'Albanie'                   },
  { flag: '🇩🇿', code: '+213', name: 'Algérie'                   },
  { flag: '🇩🇪', code: '+49',  name: 'Allemagne'                 },
  { flag: '🇦🇩', code: '+376', name: 'Andorre'                   },
  { flag: '🇦🇴', code: '+244', name: 'Angola'                    },
  { flag: '🇦🇬', code: '+1-268', name: 'Antigua-et-Barbuda'      },
  { flag: '🇸🇦', code: '+966', name: 'Arabie saoudite'           },
  { flag: '🇦🇷', code: '+54',  name: 'Argentine'                 },
  { flag: '🇦🇲', code: '+374', name: 'Arménie'                   },
  { flag: '🇦🇺', code: '+61',  name: 'Australie'                 },
  { flag: '🇦🇹', code: '+43',  name: 'Autriche'                  },
  { flag: '🇦🇿', code: '+994', name: 'Azerbaïdjan'               },
  { flag: '🇧🇸', code: '+1-242', name: 'Bahamas'                 },
  { flag: '🇧🇭', code: '+973', name: 'Bahreïn'                   },
  { flag: '🇧🇩', code: '+880', name: 'Bangladesh'                },
  { flag: '🇧🇧', code: '+1-246', name: 'Barbade'                 },
  { flag: '🇧🇾', code: '+375', name: 'Biélorussie'               },
  { flag: '🇧🇿', code: '+501', name: 'Belize'                    },
  { flag: '🇧🇯', code: '+229', name: 'Bénin'                     },
  { flag: '🇧🇹', code: '+975', name: 'Bhoutan'                   },
  { flag: '🇧🇴', code: '+591', name: 'Bolivie'                   },
  { flag: '🇧🇦', code: '+387', name: 'Bosnie-Herzégovine'        },
  { flag: '🇧🇼', code: '+267', name: 'Botswana'                  },
  { flag: '🇧🇷', code: '+55',  name: 'Brésil'                    },
  { flag: '🇧🇳', code: '+673', name: 'Brunei'                    },
  { flag: '🇧🇬', code: '+359', name: 'Bulgarie'                  },
  { flag: '🇧🇫', code: '+226', name: 'Burkina Faso'              },
  { flag: '🇧🇮', code: '+257', name: 'Burundi'                   },
  { flag: '🇨🇻', code: '+238', name: 'Cabo Verde'                },
  { flag: '🇰🇭', code: '+855', name: 'Cambodge'                  },
  { flag: '🇨🇲', code: '+237', name: 'Cameroun'                  },
  { flag: '🇨🇫', code: '+236', name: 'Centrafrique'              },
  { flag: '🇨🇱', code: '+56',  name: 'Chili'                     },
  { flag: '🇨🇳', code: '+86',  name: 'Chine'                     },
  { flag: '🇨🇾', code: '+357', name: 'Chypre'                    },
  { flag: '🇨🇴', code: '+57',  name: 'Colombie'                  },
  { flag: '🇰🇲', code: '+269', name: 'Comores'                   },
  { flag: '🇰🇷', code: '+82',  name: 'Corée du Sud'              },
  { flag: '🇰🇵', code: '+850', name: 'Corée du Nord'             },
  { flag: '🇨🇷', code: '+506', name: 'Costa Rica'                },
  { flag: '🇭🇷', code: '+385', name: 'Croatie'                   },
  { flag: '🇨🇺', code: '+53',  name: 'Cuba'                      },
  { flag: '🇩🇰', code: '+45',  name: 'Danemark'                  },
  { flag: '🇩🇯', code: '+253', name: 'Djibouti'                  },
  { flag: '🇩🇲', code: '+1-767', name: 'Dominique'               },
  { flag: '🇪🇬', code: '+20',  name: 'Égypte'                    },
  { flag: '🇦🇪', code: '+971', name: 'Émirats arabes unis'       },
  { flag: '🇪🇨', code: '+593', name: 'Équateur'                  },
  { flag: '🇪🇷', code: '+291', name: 'Érythrée'                  },
  { flag: '🇪🇸', code: '+34',  name: 'Espagne'                   },
  { flag: '🇪🇪', code: '+372', name: 'Estonie'                   },
  { flag: '🇸🇿', code: '+268', name: 'Eswatini'                  },
  { flag: '🇺🇸', code: '+1',   name: 'États-Unis'                },
  { flag: '🇪🇹', code: '+251', name: 'Éthiopie'                  },
  { flag: '🇫🇯', code: '+679', name: 'Fidji'                     },
  { flag: '🇫🇮', code: '+358', name: 'Finlande'                  },
  { flag: '🇬🇦', code: '+241', name: 'Gabon'                     },
  { flag: '🇬🇲', code: '+220', name: 'Gambie'                    },
  { flag: '🇬🇪', code: '+995', name: 'Géorgie'                   },
  { flag: '🇬🇭', code: '+233', name: 'Ghana'                     },
  { flag: '🇬🇷', code: '+30',  name: 'Grèce'                     },
  { flag: '🇬🇩', code: '+1-473', name: 'Grenade'                 },
  { flag: '🇬🇵', code: '+590', name: 'Guadeloupe'                },
  { flag: '🇬🇹', code: '+502', name: 'Guatemala'                 },
  { flag: '🇬🇳', code: '+224', name: 'Guinée'                    },
  { flag: '🇬🇼', code: '+245', name: 'Guinée-Bissau'             },
  { flag: '🇬🇶', code: '+240', name: 'Guinée équatoriale'        },
  { flag: '🇬🇾', code: '+592', name: 'Guyana'                    },
  { flag: '🇬🇫', code: '+594', name: 'Guyane française'          },
  { flag: '🇭🇹', code: '+509', name: 'Haïti'                     },
  { flag: '🇭🇳', code: '+504', name: 'Honduras'                  },
  { flag: '🇭🇺', code: '+36',  name: 'Hongrie'                   },
  { flag: '🇮🇳', code: '+91',  name: 'Inde'                      },
  { flag: '🇮🇩', code: '+62',  name: 'Indonésie'                 },
  { flag: '🇮🇷', code: '+98',  name: 'Iran'                      },
  { flag: '🇮🇶', code: '+964', name: 'Irak'                      },
  { flag: '🇮🇪', code: '+353', name: 'Irlande'                   },
  { flag: '🇮🇸', code: '+354', name: 'Islande'                   },
  { flag: '🇮🇱', code: '+972', name: 'Israël'                    },
  { flag: '🇮🇹', code: '+39',  name: 'Italie'                    },
  { flag: '🇯🇲', code: '+1-876', name: 'Jamaïque'                },
  { flag: '🇯🇵', code: '+81',  name: 'Japon'                     },
  { flag: '🇯🇴', code: '+962', name: 'Jordanie'                  },
  { flag: '🇰🇿', code: '+7',   name: 'Kazakhstan'                },
  { flag: '🇰🇪', code: '+254', name: 'Kenya'                     },
  { flag: '🇰🇬', code: '+996', name: 'Kirghizistan'              },
  { flag: '🇰🇮', code: '+686', name: 'Kiribati'                  },
  { flag: '🇽🇰', code: '+383', name: 'Kosovo'                    },
  { flag: '🇰🇼', code: '+965', name: 'Koweït'                    },
  { flag: '🇱🇦', code: '+856', name: 'Laos'                      },
  { flag: '🇱🇸', code: '+266', name: 'Lesotho'                   },
  { flag: '🇱🇻', code: '+371', name: 'Lettonie'                  },
  { flag: '🇱🇧', code: '+961', name: 'Liban'                     },
  { flag: '🇱🇷', code: '+231', name: 'Liberia'                   },
  { flag: '🇱🇾', code: '+218', name: 'Libye'                     },
  { flag: '🇱🇮', code: '+423', name: 'Liechtenstein'             },
  { flag: '🇱🇹', code: '+370', name: 'Lituanie'                  },
  { flag: '🇲🇬', code: '+261', name: 'Madagascar'                },
  { flag: '🇲🇾', code: '+60',  name: 'Malaisie'                  },
  { flag: '🇲🇼', code: '+265', name: 'Malawi'                    },
  { flag: '🇲🇻', code: '+960', name: 'Maldives'                  },
  { flag: '🇲🇱', code: '+223', name: 'Mali'                      },
  { flag: '🇲🇹', code: '+356', name: 'Malte'                     },
  { flag: '🇲🇦', code: '+212', name: 'Maroc'                     },
  { flag: '🇲🇭', code: '+692', name: 'Marshall'                  },
  { flag: '🇲🇶', code: '+596', name: 'Martinique'                },
  { flag: '🇲🇷', code: '+222', name: 'Mauritanie'                },
  { flag: '🇲🇺', code: '+230', name: 'Maurice'                   },
  { flag: '🇾🇹', code: '+262', name: 'Mayotte'                   },
  { flag: '🇲🇽', code: '+52',  name: 'Mexique'                   },
  { flag: '🇫🇲', code: '+691', name: 'Micronésie'                },
  { flag: '🇲🇩', code: '+373', name: 'Moldavie'                  },
  { flag: '🇲🇳', code: '+976', name: 'Mongolie'                  },
  { flag: '🇲🇪', code: '+382', name: 'Monténégro'                },
  { flag: '🇲🇿', code: '+258', name: 'Mozambique'                },
  { flag: '🇲🇲', code: '+95',  name: 'Myanmar'                   },
  { flag: '🇳🇦', code: '+264', name: 'Namibie'                   },
  { flag: '🇳🇷', code: '+674', name: 'Nauru'                     },
  { flag: '🇳🇵', code: '+977', name: 'Népal'                     },
  { flag: '🇳🇮', code: '+505', name: 'Nicaragua'                 },
  { flag: '🇳🇪', code: '+227', name: 'Niger'                     },
  { flag: '🇳🇬', code: '+234', name: 'Nigéria'                   },
  { flag: '🇳🇴', code: '+47',  name: 'Norvège'                   },
  { flag: '🇳🇿', code: '+64',  name: 'Nouvelle-Zélande'          },
  { flag: '🇳🇨', code: '+687', name: 'Nouvelle-Calédonie'        },
  { flag: '🇴🇲', code: '+968', name: 'Oman'                      },
  { flag: '🇺🇬', code: '+256', name: 'Ouganda'                   },
  { flag: '🇺🇿', code: '+998', name: 'Ouzbékistan'               },
  { flag: '🇵🇰', code: '+92',  name: 'Pakistan'                  },
  { flag: '🇵🇼', code: '+680', name: 'Palaos'                    },
  { flag: '🇵🇸', code: '+970', name: 'Palestine'                 },
  { flag: '🇵🇦', code: '+507', name: 'Panama'                    },
  { flag: '🇵🇬', code: '+675', name: 'Papouasie-Nouvelle-Guinée' },
  { flag: '🇵🇾', code: '+595', name: 'Paraguay'                  },
  { flag: '🇳🇱', code: '+31',  name: 'Pays-Bas'                  },
  { flag: '🇵🇪', code: '+51',  name: 'Pérou'                     },
  { flag: '🇵🇭', code: '+63',  name: 'Philippines'               },
  { flag: '🇵🇱', code: '+48',  name: 'Pologne'                   },
  { flag: '🇵🇫', code: '+689', name: 'Polynésie française'       },
  { flag: '🇵🇹', code: '+351', name: 'Portugal'                  },
  { flag: '🇶🇦', code: '+974', name: 'Qatar'                     },
  { flag: '🇨🇩', code: '+243', name: 'RD Congo'                  },
  { flag: '🇩🇴', code: '+1-809', name: 'Rép. dominicaine'        },
  { flag: '🇨🇬', code: '+242', name: 'Rép. du Congo'             },
  { flag: '🇨🇮', code: '+225', name: "Côte d'Ivoire"             },
  { flag: '🇷🇪', code: '+262', name: 'La Réunion'                },
  { flag: '🇷🇴', code: '+40',  name: 'Roumanie'                  },
  { flag: '🇬🇧', code: '+44',  name: 'Royaume-Uni'               },
  { flag: '🇷🇺', code: '+7',   name: 'Russie'                    },
  { flag: '🇷🇼', code: '+250', name: 'Rwanda'                    },
  { flag: '🇰🇳', code: '+1-869', name: 'Saint-Kitts-et-Nevis'   },
  { flag: '🇱🇨', code: '+1-758', name: 'Sainte-Lucie'            },
  { flag: '🇻🇨', code: '+1-784', name: 'Saint-Vincent'           },
  { flag: '🇸🇲', code: '+378', name: 'Saint-Marin'               },
  { flag: '🇸🇹', code: '+239', name: 'São Tomé-et-Príncipe'      },
  { flag: '🇸🇳', code: '+221', name: 'Sénégal'                   },
  { flag: '🇷🇸', code: '+381', name: 'Serbie'                    },
  { flag: '🇸🇨', code: '+248', name: 'Seychelles'                },
  { flag: '🇸🇱', code: '+232', name: 'Sierra Leone'              },
  { flag: '🇸🇬', code: '+65',  name: 'Singapour'                 },
  { flag: '🇸🇰', code: '+421', name: 'Slovaquie'                 },
  { flag: '🇸🇮', code: '+386', name: 'Slovénie'                  },
  { flag: '🇸🇧', code: '+677', name: 'Salomon'                   },
  { flag: '🇸🇴', code: '+252', name: 'Somalie'                   },
  { flag: '🇸🇩', code: '+249', name: 'Soudan'                    },
  { flag: '🇸🇸', code: '+211', name: 'Soudan du Sud'             },
  { flag: '🇱🇰', code: '+94',  name: 'Sri Lanka'                 },
  { flag: '🇸🇷', code: '+597', name: 'Suriname'                  },
  { flag: '🇸🇪', code: '+46',  name: 'Suède'                     },
  { flag: '🇸🇾', code: '+963', name: 'Syrie'                     },
  { flag: '🇹🇯', code: '+992', name: 'Tadjikistan'               },
  { flag: '🇹🇼', code: '+886', name: 'Taïwan'                    },
  { flag: '🇹🇿', code: '+255', name: 'Tanzanie'                  },
  { flag: '🇹🇩', code: '+235', name: 'Tchad'                     },
  { flag: '🇨🇿', code: '+420', name: 'Tchéquie'                  },
  { flag: '🇹🇭', code: '+66',  name: 'Thaïlande'                 },
  { flag: '🇹🇱', code: '+670', name: 'Timor-Leste'               },
  { flag: '🇹🇬', code: '+228', name: 'Togo'                      },
  { flag: '🇹🇴', code: '+676', name: 'Tonga'                     },
  { flag: '🇹🇹', code: '+1-868', name: 'Trinité-et-Tobago'       },
  { flag: '🇹🇳', code: '+216', name: 'Tunisie'                   },
  { flag: '🇹🇲', code: '+993', name: 'Turkménistan'              },
  { flag: '🇹🇷', code: '+90',  name: 'Turquie'                   },
  { flag: '🇹🇻', code: '+688', name: 'Tuvalu'                    },
  { flag: '🇺🇦', code: '+380', name: 'Ukraine'                   },
  { flag: '🇺🇾', code: '+598', name: 'Uruguay'                   },
  { flag: '🇻🇺', code: '+678', name: 'Vanuatu'                   },
  { flag: '🇻🇦', code: '+379', name: 'Vatican'                   },
  { flag: '🇻🇪', code: '+58',  name: 'Venezuela'                 },
  { flag: '🇻🇳', code: '+84',  name: 'Vietnam'                   },
  { flag: '🇼🇸', code: '+685', name: 'Samoa'                     },
  { flag: '🇾🇪', code: '+967', name: 'Yémen'                     },
  { flag: '🇿🇲', code: '+260', name: 'Zambie'                    },
  { flag: '🇿🇼', code: '+263', name: 'Zimbabwe'                  },
];

function flagToISO(flag: string): string | null {
  if (!flag || flag === '─') return null;
  try {
    const chars = [...flag];
    if (chars.length !== 2) return null;
    return chars.map(c => String.fromCharCode(c.codePointAt(0)! - 0x1F1E6 + 0x61)).join('');
  } catch { return null; }
}

const EMPTY = {
  poster_name: '', email: '', animal_type: '', breed: '',
  age_number: '', age_unit: 'ans', gender: 'inconnu', country: 'Belgique', region: '', description: '',
  reason: '', indicatif: '+32', contact_phone: '',
};

interface PhotoEntry { file: File; preview: string }

export default function AdoptionPostForm() {
  const router = useRouter();
  const [form, setForm]     = useState(EMPTY);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError]   = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef    = useRef<HTMLInputElement>(null);
  const phoneDropRef = useRef<HTMLDivElement>(null);
  const [phoneOpen, setPhoneOpen]     = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [indicatifFlag, setIndicatifFlag] = useState('🇧🇪');

  useEffect(() => {
    if (!phoneOpen) return;
    function handler(e: MouseEvent) {
      if (phoneDropRef.current && !phoneDropRef.current.contains(e.target as Node)) {
        setPhoneOpen(false);
        setPhoneSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [phoneOpen]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => {
        const preview = e.target?.result as string;
        setPhotos(prev => prev.length < 5 ? [...prev, { file: f, preview }] : prev);
      };
      reader.readAsDataURL(f);
    });
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length < 2) { setError("Veuillez ajouter au moins 2 photos de l'animal."); return; }
    setStatus('loading'); setError(''); setUploadProgress(0);
    try {
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const fd = new FormData();
        fd.append('file', photos[i].file);
        const res  = await fetch('/api/adoption/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur upload photo');
        photoUrls.push(data.url);
        setUploadProgress(i + 1);
      }
      const { country, region, indicatif, contact_phone, age_number, age_unit, ...rest } = form;
      const res = await fetch('/api/adoption/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rest,
          age: `${age_number} ${age_unit}`,
          region: region ? `${region}, ${country}` : country,
          contact_phone: `${indicatif} ${contact_phone.trim().replace(/^0+/, '')}`,
          photo_urls: photoUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); setStatus('error'); return; }
      setStatus('success'); setForm(EMPTY); setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
      setStatus('error');
    }
  }

  const filteredPhoneCodes = phoneSearch.trim()
    ? PHONE_CODES.filter(p => p.code !== '─' && p.name.toLowerCase().includes(phoneSearch.toLowerCase()))
    : PHONE_CODES;

  const inputCls = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30';

  if (status === 'success') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-3"><CheckCircle2 size={48} strokeWidth={1.5} className="text-emerald-600" /></div>
        <h3 className="text-gray-900 font-semibold text-lg mb-2">Annonce envoyée !</h3>
        <p className="text-gray-500 text-sm">Votre annonce est en cours de vérification et sera publiée dès validation.</p>
        <button onClick={() => router.push('/adoption')} className="mt-4 text-orange-600 hover:underline text-sm">Revenir aux annonces</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-800 font-medium">
            Photos de l'animal <span className="text-amber-500">*</span>
            <span className="text-gray-500 ml-1">(2 min · 5 max)</span>
          </label>
          <span className={`text-xs font-medium ${photos.length >= 2 ? 'text-emerald-600' : 'text-gray-500'}`}>{photos.length} / 5</span>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mb-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-lg border border-dashed border-gray-300 hover:border-amber-500/50 flex items-center justify-center text-gray-500 hover:text-amber-500 transition-colors text-xl">+</button>
            )}
          </div>
        )}
        {photos.length === 0 && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-full border border-dashed border-gray-300 hover:border-amber-500/50 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors">
            <span className="text-sm font-medium">Cliquez pour ajouter des photos</span>
            <span className="text-xs text-gray-500">JPG, PNG, WebP · Max 5 Mo par photo</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      </div>

      {/* Prénom · Email · Téléphone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Votre prénom *</label>
          <input type="text" required value={form.poster_name} onChange={e => set('poster_name', e.target.value)} placeholder="Jean" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Votre email (privé) *</label>
          <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="vous@email.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">
            Téléphone * <span className="text-gray-400 font-normal">(privé)</span>
          </label>
          <div className="flex gap-1.5">
            <div ref={phoneDropRef} className="relative flex-shrink-0">
              <button type="button"
                onClick={() => { setPhoneOpen(o => !o); setPhoneSearch(''); }}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-2 h-[38px] text-sm flex items-center gap-1 hover:border-gray-400 transition-colors">
                {flagToISO(indicatifFlag) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`https://flagcdn.com/20x15/${flagToISO(indicatifFlag)}.png`} width={20} height={15} alt="" className="flex-shrink-0" />
                )}
                <span className="text-xs text-gray-600">{form.indicatif}</span>
                <span className="text-gray-400 text-[10px]">▾</span>
              </button>
              {phoneOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input autoFocus type="text" value={phoneSearch}
                      onChange={e => setPhoneSearch(e.target.value)}
                      placeholder="Rechercher un pays…"
                      className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-amber-400" />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredPhoneCodes.map((p, i) =>
                      p.code === '─'
                        ? <div key={i} className="mx-2 my-1 border-t border-gray-100" />
                        : (
                          <button key={p.flag + p.code + p.name} type="button"
                            onClick={() => { set('indicatif', p.code); setIndicatifFlag(p.flag); setPhoneOpen(false); setPhoneSearch(''); }}
                            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-amber-50 transition-colors ${form.indicatif === p.code && indicatifFlag === p.flag ? 'bg-amber-50 font-medium' : ''}`}>
                            {flagToISO(p.flag)
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={`https://flagcdn.com/20x15/${flagToISO(p.flag)}.png`} width={20} height={15} alt="" className="flex-shrink-0" />
                              : <span className="w-5" />}
                            <span className="text-gray-400 text-xs w-9 flex-shrink-0">{p.code}</span>
                            <span className="text-gray-800 truncate">{p.name}</span>
                          </button>
                        )
                    )}
                    {filteredPhoneCodes.filter(p => p.code !== '─').length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-4">Aucun pays trouvé</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <input type="tel" required value={form.contact_phone}
              onChange={e => set('contact_phone', e.target.value.replace(/^0+/, ''))}
              placeholder="487 12 34 56" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Animal — 3 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Type d'animal *</label>
          <select required value={form.animal_type} onChange={e => set('animal_type', e.target.value)} className={inputCls}>
            <option value="">Choisir...</option>
            {ANIMAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          {form.animal_type === 'autre' ? (
            <>
              <label className="block text-xs text-gray-800 mb-1.5 font-medium">Quel animal ? *</label>
              <input required type="text" value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="ex : Cheval, Cochon, Araignée…" className={inputCls} />
            </>
          ) : (
            <>
              <label className="block text-xs text-gray-800 mb-1.5 font-medium">Race / Espèce</label>
              <input type="text" value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="ex : Labrador, Siamois…" className={inputCls} />
            </>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Âge *</label>
          <div className="flex gap-1.5">
            <input type="number" required min={1} max={99}
              value={form.age_number} onChange={e => set('age_number', e.target.value)}
              placeholder="ex : 3" className={`${inputCls} flex-1 min-w-0`} />
            <select value={form.age_unit} onChange={e => set('age_unit', e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 flex-shrink-0">
              <option value="mois">mois</option>
              <option value="ans">ans</option>
            </select>
          </div>
        </div>
      </div>

      {/* Localisation + sexe — 3 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Sexe</label>
          <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
            <option value="inconnu">Inconnu</option>
            <option value="mâle">Mâle</option>
            <option value="femelle">Femelle</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Pays *</label>
          <select required value={form.country} onChange={e => set('country', e.target.value)} className={inputCls}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-800 mb-1.5 font-medium">Région / Ville *</label>
          <input type="text" required value={form.region} onChange={e => set('region', e.target.value)} placeholder="ex : Bruxelles" className={inputCls} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-gray-800 mb-1.5 font-medium">Description *</label>
        <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={4}
          placeholder="Décrivez l'animal : comportement, besoins, caractère…"
          className={`${inputCls} resize-none`} />
      </div>

      {/* Raison */}
      <div>
        <label className="block text-xs text-gray-800 mb-1.5 font-medium">Raison du don *</label>
        <textarea required value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
          placeholder="Expliquez pourquoi vous donnez votre animal (déménagement, allergie, manque de temps…)"
          className={`${inputCls} resize-none`} />
      </div>

      <button type="submit" disabled={status === 'loading'}
        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
        {status === 'loading' && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {status === 'loading'
          ? uploadProgress < photos.length ? `Upload photo ${uploadProgress + 1} / ${photos.length}…` : 'Envoi…'
          : "Soumettre l'annonce"}
      </button>
    </form>
  );
}
