export default {
  title: "依燃天堂",
  description: "依燃是少年",
  lang: 'zh-CN',

  themeConfig: {
    
    siteTitle: false,
    logo:'./logo.png',
    nav: [
      { text: '首页', link: '/' },
      { text: '掉宝查询', link: '/drop' },
      { text: '击杀查询', link: '/pk' },
      {
        text: '快速导航',
        items: [
          { text: '下载安装', link: '/download' },
          { text: '基础设置', link: '/basicsetting' },
          { text: '特色系统', link: '/specialsetting' }
        ]
      }
    ],

    sidebar: [
      {
        text: '下载安装',
        collapsed: false,
        items: [
          { text: '下载', link: '/download' },
          { text: '安装', link: '/install' },
          { text: '登陆', link: '/login' },

        ]
      },
      {
        text: '版本介绍',
        collapsed: false,
        items: [
          { text: '基础设定', link: '/basicsetting' },
          { text: '特色系统', link: '/specialsetting' },
          { text: '依燃Plus', link: '/yiranplus' },
        ]
      },
      {
        text: '实时数据',
        collapsed: false,
        items: [
          { text: '掉宝查询', link: '/drop' },
          { text: '击杀查询', link: '/pk' },
          { text: '怪物掉落', link: '/droplist' },
        ]
      },
      {
        text: '依燃百科',
        collapsed: false,
        items: [
          {
            text: '• 属性',
            collapsed: false,
            items: [
              { text: '力量', link: 'attribute-str' },
              { text: '敏捷', link: 'attribute-dex' },
              { text: '智力', link: 'attribute-int' },
              { text: '体质', link: 'attribute-con' },
              { text: '精神', link: 'attribute-wis' },
              { text: '魅力', link: 'attribute-cha' }
            ]
          },
          {
            text: '• 武器',
            collapsed: false,
            items: [
              { text: '单手剑', link: 'weapon-sword' },
              { text: '双手剑', link: 'weapon-twohandsword' },
              { text: '匕首', link: 'weapon-dagger' },
              { text: '弓箭', link: 'weapon-bow' },
              { text: '魔杖', link: 'weapon-staff' },
              { text: '双刀', link: 'weapon-edoryu' },                     
              { text: '钢爪', link: 'weapon-claw' },
              { text: '斧头', link: 'weapon-blunt' },
              { text: '长矛', link: 'weapon-spear' }              
            ]
          },
          {
            text: '• 防具',
            collapsed: false,
            items: [
              { text: '项链', link: 'armor-amulet' },
              { text: '耳环', link: 'armor-earring' },              
              { text: '戒指', link: 'armor-ring' }, 
              { text: '腰带', link: 'armor-belt' }, 
              { text: '头盔', link: 'armor-helm' }, 
              { text: '盔甲', link: 'armor-armor' }, 
              { text: '长靴', link: 'armor-boots' }, 
              { text: '斗篷', link: 'armor-cloak' }, 
              { text: '盾牌', link: 'armor-shield' }, 
              { text: '衬衫', link: 'armor-shirt' }, 
              { text: '套装', link: 'armor-set' }, 
            ]
          }
        ]
      }
    ],
    
    search: {
      provider: 'local'
    },

    footer: {
      message: '<a href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=uZmEgD6gqidaNBfcfNazO-1QezuvHikJ&authKey=hpYpRVbc%2BavJa2TYWcbxlVP9vE1va1Z5Pt4FsTyDmhRPLxDxX6ZxsCumg%2B8kZZPN&noverify=0&group_code=491972184" target=_blank>点击加入QQ群</a>',
      copyright: 'Copyright © 2021-present 依燃天堂'
    },
    outlineTitle: '本页导航'
  },

  head: [
    // 保留原有的 Google Analytics 脚本
    [
      'script',
      { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-L80F9522RJ' }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-L80F9522RJ');`
    ],
    // 添加自定义样式来调整 logo 尺寸
    [
      'style',
      {},
      `
      .VPNavBarTitle .logo {
        height: 50px !important;
        width: auto !important;
      }
      @media (max-width: 768px) {
        .VPNavBarTitle .logo {
          height: 32px !important;
        }
      }
      `
    ]
  ]
}

