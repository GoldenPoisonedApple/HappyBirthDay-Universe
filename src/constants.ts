import * as THREE from 'three';

// 地球の軸傾斜角度（ラジアン）
export const TILT_ANGLE = -23.4 * (Math.PI / 180);

// カメラオフセット設定
export const CLOSE_OFFSET = new THREE.Vector3(0, 2, 6);  // 自転モード時のカメラオフセット
export const FAR_OFFSET = new THREE.Vector3(0, 24, 24);   // 公転モード時のカメラオフセット

// 補間速度設定
export const ZOOM_INTERPOLATION_SPEED = 6;     // ズーム遷移の補間速度
export const TARGET_INTERPOLATION_SPEED = 6;   // カメラ注視点の補間速度

// モード切替閾値
export const ORBIT_MODE_THRESHOLD = 0.55;      // 公転モードに切替えるズーム値

// 地球の半径設定
export const EARTH_RADIUS_ROTATION = 2;        // 自転モード時の地球半径
export const EARTH_RADIUS_ORBIT = 1.2;         // 公転モード時の地球半径

// 公転軌道設定
export const ORBIT_RADIUS = 18;                // 公転軌道の半径

// ドラッグ感度設定
export const DRAG_SENSITIVITY_VERTICAL = 0.0015;   // 垂直ドラッグの感度

// 時間シミュレーション設定
export const SECONDS_PER_DAY = 86400;          // 1日の秒数
export const SECONDS_PER_YEAR = 31556952;      // 1年の秒数 (365.2425日)

// 定常速度（現実の1秒あたり、シミュレーション内で何秒進むか）
export const BASE_TIME_SPEED_ROTATION = SECONDS_PER_DAY / 8; // 8秒で1日進む
export const BASE_TIME_SPEED_ORBIT = SECONDS_PER_YEAR / 150;  // 15秒で1年進む

// ドラッグ感度（1ピクセルのドラッグで進むシミュレーション秒数）
export const DRAG_TIME_SENSITIVITY_ROTATION = SECONDS_PER_DAY / 2000; // 200pxドラッグで1日
export const DRAG_TIME_SENSITIVITY_ORBIT = SECONDS_PER_YEAR / 200000;   // 200pxドラッグで1年

export const DAMPING_FACTOR = 5.0;             // 慣性の減衰係数

// ジオメトリ設定
export const POINTS_COUNT = 2000;             // 球体上のパーティクル数
export const AXIS_LINE_MULTIPLIER = 1.2;      // 軸線の長さ倍率