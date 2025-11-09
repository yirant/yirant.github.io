---
title: 排行榜
description: 查询玩家装备排行榜
---
# 排行榜
## 首饰排行榜

<MySQLTable 
  tableName="rank_accessory" 
  apiEndpoint="/rank/accessory"
  fields="char_name,enchantlvl,item_name" 
  orderBy="enchantlvl DESC" 
  :showStatistics="false"
  :fieldAliases="{
    char_name: '玩家',
    enchantlvl: '强化',
    item_name: '首饰'
  }"
/>

## 武器排行榜

<MySQLTable 
  tableName="rank_weapon" 
  apiEndpoint="/rank/weapon"
  fields="char_name,enchantlvl,item_name" 
  orderBy="enchantlvl DESC" 
  :showStatistics="false"
  :fieldAliases="{
    char_name: '玩家',
    enchantlvl: '强化',
    item_name: '武器'
  }"
/>

## 防具排行榜

<MySQLTable 
  tableName="rank_armor" 
  apiEndpoint="/rank/armor"
  fields="char_name,enchantlvl,item_name" 
  orderBy="enchantlvl DESC" 
  :showStatistics="false"
  :fieldAliases="{
    char_name: '玩家',
    enchantlvl: '强化',
    item_name: '防具'
  }"
/>

