// アプリケーション全体で使用する定数定義ファイル
// 物理定数、カメラ設定、ジオメトリパラメータなどを一元管理
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

// 公転物理設定
export const ORBIT_VELOCITY_DECAY_FACTOR = 2.0; // 公転速度の減衰係数
export const MIN_ORBIT_VELOCITY = 0.0001;      // 最低公転速度
export const SELF_ROTATION_RATIO = 365;        // 自転と公転の速度比（1公転 = 365自転）

// ドラッグ感度設定
export const DRAG_SENSITIVITY_HORIZONTAL = 0.005;  // 水平ドラッグの感度
export const DRAG_SENSITIVITY_VERTICAL = 0.0015;   // 垂直ドラッグの感度
export const DRAG_SENSITIVITY_ORBIT = 0.002;      // 公転速度調整のドラッグ感度

// 物理シミュレーション設定
export const DAMPING_FACTOR = 5.0;             // 回転減衰係数
export const CONSTANT_ROTATION_SPEED = 0.01;   // 定常回転速度
export const VELOCITY_THRESHOLD = 0.0001;      // 速度の閾値（これ以下は0とみなす）

// ジオメトリ設定
export const POINTS_COUNT = 1000;              // 球面上に配置するパーティクル数
export const AXIS_LINE_MULTIPLIER = 1.2;       // 軸線の長さ倍率