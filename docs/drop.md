---
title: 掉宝查询
description: 实时查询游戏掉宝记录
---

# 掉宝查询

<MySQLTable 
  tableName="zzlog_drop" 
  fields="pcName,itemName,count,s,time" 
  orderBy="id DESC" 
  dataRange="31d"
  :showStatistics="true"
  :fieldAliases="{
    pcName: '玩家',
    itemName: '道具',
    count: '数量',
    s: '怪物',
    time: '时间'
  }"
/>