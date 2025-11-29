package com.rally.ai_land.domain.player.service;

import org.springframework.stereotype.Component;

@Component
public class StateManagerService {

    // [플레이어 맵 온라인] 플레이어 맵 온라인 등록
    public void registerPlayerMapOnline(Long mapId, Long playerId) {

    }

    // [플레이어 맵 온라인] 플레이어 맵 온라인 제거
    public void removePlayerMapOnline(Long playerId) {

    }

    // [플레이어 맵 온라인] 플레이어 맵 온라인 아이디 및 플레이어 정보 제공: Pipelining 기법
    public void getPlayerMapOnline(Long mapId) {

    }

    // [플레이어 정보] 플레이어 정보 추가: TTL 로 존재 가능
    public void addPlayerInfo(Long playerId) {

    }

    // [플레이어 정보] 플레이어 정보 제거: TTL 관리
//    public void removePlayerInfo(Long playerId) {
//
//    }

    // [플레이어 포지션] 플레이어 포지션 추가 및 초기화: Hash 자료구조로 덮어쓰기 되는지 점검
    public void addOrInitializePlayerPosition(Long playerId, double x, double y) {

    }

    // [플레이어 포지션] 플레이어 포지션 업데이트
    public void updatePlayerPosition(Long playerId, double x, double y, short dir) {

    }

    // [플레이어 포지션] 플레이어 포지션 제거: TTL 관리
//    public void removePlayerPosition(Long playerId) {
//
//    }

    // [플레이어 포지션] 플레이어 포지션 전체 조회
    public void getAllPlayerPositions(Long mapId) {

    }
}