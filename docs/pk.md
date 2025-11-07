---
title: 击杀查询
description: 实时查询游戏PK记录
---

# 击杀查询

<MySQLTable 
  tableName="zzlog_killpc" 
  fields="pcName,nacName,mapName,time" 
  orderBy="id DESC" 
  dataRange="15d"
  :showStatistics="true"
  :fieldAliases="{
    pcName: '胜者',
    nacName: '败者',
    mapName: '地图',
    time: '时间'
  }"
/>