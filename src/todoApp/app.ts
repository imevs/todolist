import Controller from './controller';
import {$on} from './helpers';
import Template from './template';
import Store from './store';
import View from './view';

const store = new Store('todos-vanilla-typescript');

const template = new Template();
const view = new View(template);

const controller = new Controller(store, view);
export const todoApp = controller;

const setView = () => controller.setView(document.location.hash);
$on(window, 'load', setView);
$on(window, 'hashchange', setView);
